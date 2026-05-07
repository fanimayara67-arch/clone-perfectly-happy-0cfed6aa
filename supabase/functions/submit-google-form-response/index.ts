import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_FORM_ID = "1FAIpQLSfkK5RUJIZ6a95AGx7zHDJAKWo9a1_SSEVO9umV8l5idc5VHw";
const GOOGLE_FORM_ENTRIES: Record<string, string> = {
  tracking_code: "1804684228",
  q_1: "442706269",
  q_2: "1935997617",
  q_3: "143558976",
  q_4: "99514619",
  q_5: "257452622",
  q_6: "1507661215",
  q_7: "1126335688",
  q_8: "475578328",
  q_9: "1402506352",
  q_10: "274223193",
  q_11: "66142070",
  comments: "260238313",
};

const AnswerValue = z.union([z.string(), z.array(z.string())]);
const BodySchema = z.object({
  trackingCode: z.string().min(6).max(32),
  screening: z.record(AnswerValue).default({}),
  main: z.record(AnswerValue),
});

const appendValue = (body: URLSearchParams, entryId: string, value?: string | string[] | null) => {
  if (!entryId || value === undefined || value === null || value === "") return;

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item) body.append(`entry.${entryId}`, item);
    });
    return;
  }

  body.append(`entry.${entryId}`, value);
};

const appendAnswerMap = (body: URLSearchParams, answers: Record<string, string | string[]>) => {
  Object.entries(answers).forEach(([key, value]) => {
    appendValue(body, GOOGLE_FORM_ENTRIES[key], value);
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { trackingCode, screening, main } = parsed.data;
    const normalizedCode = trackingCode.trim().toUpperCase();

    if (!/^UFTC-[A-Z0-9]{4,16}$/.test(normalizedCode)) {
      return new Response(JSON.stringify({ error: "Token inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuração do backend ausente.");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: responseRow, error: responseError } = await admin
      .from("survey_responses")
      .select("id, screening_answers")
      .eq("tracking_code", normalizedCode)
      .maybeSingle();

    if (responseError) throw responseError;
    if (!responseRow) {
      return new Response(JSON.stringify({ error: "Resposta vinculada ao token não encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tokenRow, error: tokenError } = await admin
      .from("valid_tokens")
      .select("code, is_active, used_at")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (tokenError) throw tokenError;
    if (!tokenRow || !tokenRow.is_active || tokenRow.used_at) {
      return new Response(JSON.stringify({ error: "Esse token é inválido ou já foi utilizado." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = new URLSearchParams();
    appendValue(body, GOOGLE_FORM_ENTRIES.tracking_code, normalizedCode);
    appendAnswerMap(body, screening);
    appendAnswerMap(body, main);

    const googleResponse = await fetch(`https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      redirect: "follow",
    });

    if (!googleResponse.ok) {
      throw new Error(`Falha ao enviar ao Google Forms (${googleResponse.status}).`);
    }

    const { data: confirmed, error: confirmError } = await admin.rpc("confirm_response_with_token", {
      _tracking_code: normalizedCode,
    });

    if (confirmError) throw confirmError;
    if (!confirmed) {
      return new Response(JSON.stringify({ error: "Não foi possível confirmar o token após o envio." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mergedScreening = {
      ...((responseRow.screening_answers as Record<string, unknown> | null) ?? {}),
      questionnaire: screening,
    };

    const { error: updateError } = await admin
      .from("survey_responses")
      .update({
        screening_answers: mergedScreening,
        main_answers: main,
      })
      .eq("id", responseRow.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("submit-google-form-response error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
