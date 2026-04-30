// Edge function: sync-google-form-responses
// Reads the Google Sheet bound to the Google Form and validates each
// "Código de identificação" against the tokens issued by the site.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ====== Google Service Account auth → access token ======
async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsigned = `${enc(header)}.${enc(claim)}`;

  // Import private key (PEM PKCS8) for RS256 signing
  const pem = (sa.private_key as string)
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const jwt = `${unsigned}.${sig}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token error: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const json = await tokenRes.json();
  return json.access_token as string;
}

// Find the column index whose header looks like the tracking-code field.
function findCodeColumn(header: string[]): number {
  const candidates = [
    "código de identificação",
    "codigo de identificacao",
    "código",
    "codigo",
    "tracking code",
    "código uftc",
  ];
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const idx = header.findIndex((h) => candidates.some((c) => norm(h).includes(norm(c))));
  return idx;
}

// Find timestamp column (Google Forms always adds "Carimbo de data/hora" / "Timestamp")
function findTimestampColumn(header: string[]): number {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return header.findIndex((h) => /carimbo|timestamp|data\/?hora/.test(norm(h)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SHEET_ID = Deno.env.get("GOOGLE_FORM_RESPONSES_SHEET_ID");
    const SA_JSON = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

    if (!SHEET_ID) {
      return new Response(
        JSON.stringify({
          error:
            "GOOGLE_FORM_RESPONSES_SHEET_ID não configurado. Configure o ID da planilha de respostas vinculada ao Google Forms.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!SA_JSON) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON não configurado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read sheet
    const accessToken = await getGoogleAccessToken(SA_JSON);
    const sheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:ZZ10000`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!sheetRes.ok) {
      const t = await sheetRes.text();
      throw new Error(`Sheets API error ${sheetRes.status}: ${t}`);
    }
    const sheetJson = await sheetRes.json();
    const rows: string[][] = sheetJson.values ?? [];
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, valid: 0, invalid: 0, message: "Sem respostas" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const header = rows[0];
    const codeCol = findCodeColumn(header);
    const tsCol = findTimestampColumn(header);
    if (codeCol < 0) {
      throw new Error(
        "Coluna de código de identificação não encontrada na planilha. Verifique o cabeçalho do Google Forms.",
      );
    }

    let valid = 0;
    let invalid = 0;
    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      const rawCode = (row[codeCol] ?? "").toString().trim();
      const ts = tsCol >= 0 ? row[tsCol] : null;
      const payload: Record<string, string> = {};
      header.forEach((h, i) => (payload[h] = row[i] ?? ""));

      const normalized = rawCode.toUpperCase();

      // Try to confirm; the SQL function checks format, existence and consumes the token.
      const { data: ok, error } = await admin.rpc("confirm_response_with_token", {
        _tracking_code: normalized,
      });

      if (error) {
        console.error("RPC error", error);
        continue;
      }

      if (ok) {
        // Save form payload into main_answers for the validated response
        await admin
          .from("survey_responses")
          .update({ main_answers: payload })
          .eq("tracking_code", normalized);
        valid++;
      } else {
        // Avoid logging the same invalid attempt twice
        const { data: existing } = await admin
          .from("invalid_form_responses")
          .select("id")
          .eq("attempted_code", normalized || "")
          .eq("form_submitted_at", ts ? new Date(ts).toISOString() : null)
          .maybeSingle();
        if (!existing) {
          await admin.from("invalid_form_responses").insert({
            attempted_code: normalized || null,
            form_submitted_at: ts ? new Date(ts).toISOString() : null,
            payload,
            reason: !rawCode
              ? "código ausente"
              : !/^UFTC-[A-Z0-9]{4,16}$/.test(normalized)
              ? "formato inválido"
              : "código não encontrado / já usado",
          });
        }
        invalid++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: dataRows.length, valid, invalid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
