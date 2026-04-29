import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, Copy, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TokenRow {
  id: string;
  code: string;
  is_active: boolean;
  used_at: string | null;
  notes: string | null;
  created_at: string;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateCode = () => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes).map((b) => ALPHABET[b % ALPHABET.length]).join("");
  return `UFTC-${suffix}`;
};

export const TokenManager = () => {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [batchSize, setBatchSize] = useState(1);
  const [customCode, setCustomCode] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("valid_tokens")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar tokens");
    } else {
      setTokens((data || []) as TokenRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createOne = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!/^UFTC-[A-Z0-9]{4,16}$/.test(normalized)) {
      toast.error(`Formato inválido: ${normalized}`);
      return false;
    }
    const { error } = await supabase.from("valid_tokens").insert({ code: normalized });
    if (error) {
      if (error.code === "23505") toast.error(`Token ${normalized} já existe`);
      else toast.error(`Erro: ${error.message}`);
      return false;
    }
    return true;
  };

  const handleCreateCustom = async () => {
    if (!customCode) return;
    setCreating(true);
    const ok = await createOne(customCode);
    if (ok) {
      toast.success("Token criado");
      setCustomCode("");
      await load();
    }
    setCreating(false);
  };

  const handleGenerateBatch = async () => {
    const n = Math.max(1, Math.min(100, batchSize));
    setCreating(true);
    const codes = Array.from({ length: n }, generateCode);
    const { data, error } = await supabase
      .from("valid_tokens")
      .insert(codes.map((c) => ({ code: c })))
      .select();
    setCreating(false);
    if (error) {
      toast.error(`Erro: ${error.message}`);
      return;
    }
    toast.success(`${data?.length ?? n} tokens gerados`);
    await load();
  };

  const toggleActive = async (token: TokenRow) => {
    const { error } = await supabase
      .from("valid_tokens")
      .update({ is_active: !token.is_active })
      .eq("id", token.id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (token: TokenRow) => {
    if (!confirm(`Excluir token ${token.code}?`)) return;
    const { error } = await supabase.from("valid_tokens").delete().eq("id", token.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Token excluído");
      load();
    }
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copiado");
  };

  const exportCsv = () => {
    if (tokens.length === 0) return toast.error("Nada para exportar");
    const headers = ["codigo", "ativo", "usado_em", "criado_em", "observacoes"];
    const rows = tokens.map((t) => [
      t.code,
      t.is_active ? "sim" : "nao",
      t.used_at ? new Date(t.used_at).toLocaleString("pt-BR") : "",
      new Date(t.created_at).toLocaleString("pt-BR"),
      (t.notes || "").replace(/"/g, '""'),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokens-uniftc-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: tokens.length,
    used: tokens.filter((t) => t.used_at).length,
    available: tokens.filter((t) => t.is_active && !t.used_at).length,
    inactive: tokens.filter((t) => !t.is_active).length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox label="Total" value={stats.total} />
        <StatBox label="Disponíveis" value={stats.available} tone="success" />
        <StatBox label="Usados" value={stats.used} tone="muted" />
        <StatBox label="Inativos" value={stats.inactive} tone="warn" />
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/60 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Criar token específico
            </p>
            <div className="flex gap-2">
              <Input
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="UFTC-7RDHED"
                className="font-mono"
              />
              <Button onClick={handleCreateCustom} disabled={creating || !customCode}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gerar tokens aleatórios
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-24"
              />
              <Button onClick={handleGenerateBatch} disabled={creating} variant="default" className="flex-1">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                Gerar {batchSize}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border/60">
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card border border-border/60 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum token cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border/60">
                <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Usado em</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Criado em</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copy(t.code)}
                        className="font-mono text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {t.code}
                        <Copy className="h-3 w-3 opacity-60" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {t.used_at ? (
                        <Badge variant="outline" className="border-muted text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Usado
                        </Badge>
                      ) : t.is_active ? (
                        <Badge className="bg-success text-success-foreground hover:bg-success">
                          Disponível
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-500/50 text-orange-600 dark:text-orange-400">
                          <XCircle className="h-3 w-3 mr-1" /> Inativo
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {t.used_at ? new Date(t.used_at).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {!t.used_at && (
                          <Switch
                            checked={t.is_active}
                            onCheckedChange={() => toggleActive(t)}
                            aria-label="Ativar/desativar"
                          />
                        )}
                        <Button size="sm" variant="ghost" onClick={() => remove(t)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warn" | "muted";
}) => {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warn"
      ? "text-orange-500"
      : tone === "muted"
      ? "text-muted-foreground"
      : "text-foreground";
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/60">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
};
