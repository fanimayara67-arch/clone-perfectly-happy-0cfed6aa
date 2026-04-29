## Objetivo

Fazer com que o app só libere o passo do Google Forms quando o usuário digitar um **token válido** (como funciona um CPF: existe ou não existe na base). E preparar a integração com o seu Google Forms via OAuth para automação futura.

## Como funcionará o token

Hoje o app **gera** um código aleatório (`UFTC-XXXXXX`) e exibe pro participante. Você quer o inverso: o participante **digita** um token e o sistema valida se ele é válido.

### Fluxo novo

```text
Termo  →  Critérios  →  Dados pessoais  →  [NOVO] Validar Token  →  Google Forms  →  Fim
                                                  │
                                                  ↓
                                         Banco: tabela valid_tokens
                                         (UFTC-7RDHED, etc.)
                                         Token inválido = bloqueia
                                         Token já usado = bloqueia
```

### Banco de dados

Criar tabela `valid_tokens`:
- `code` (texto, único) — ex: `UFTC-7RDHED`
- `is_active` (bool) — permite desativar sem apagar
- `used_at` (timestamp) — marca quando foi usado (one-shot)
- `used_by_response_id` (uuid) — qual resposta consumiu o token
- `created_at`

RLS:
- `anon` pode apenas chamar uma **função RPC** `validate_token(code)` que retorna `true/false`. Não pode dar SELECT direto na tabela (segurança — evita enumeração).
- Apenas admin pode listar/inserir/editar tokens via painel.

Função RPC nova `validate_and_consume_token(code, response_id)`:
- Verifica formato (`^UFTC-[A-Z0-9]{6,12}$`)
- Confere se existe, está ativo e não usado
- Marca como usado e vincula à resposta
- Retorna `true/false`

### Tela nova: "Validar Token"

Componente `TokenValidationStep`:
- Campo único formatado `UFTC-XXXXXX`
- Botão "Validar"
- Se válido → salva resposta no banco com aquele `tracking_code` e avança pro Google Forms
- Se inválido → mostra erro "Token inválido ou já utilizado"
- Limite: 5 tentativas por sessão antes de bloquear por 1 minuto (anti-bruteforce básico)

Remover o `generateTrackingCode()` atual — não geramos mais, validamos.

### Painel Admin — gestão de tokens

Nova aba em `/admin` "Tokens":
- Listar tokens (código, ativo, usado em, por quem)
- Criar token único ou em lote (gerar N tokens `UFTC-XXXXXX`)
- Ativar/desativar
- Exportar CSV

Inserir o token inicial `UFTC-7RDHED` via migration.

## Integração Google Forms (OAuth)

Vou conectar seu Google via o connector **Google Drive** (que dá acesso ao Forms também via Drive API) ou pedir para você confirmar qual conta usar.

> Importante: a API oficial do Google Forms permite **ler estrutura e respostas**, mas **não** permite editar perguntas de Forms criados manualmente (só Forms criados pela API). Então o que dá pra fazer com OAuth:

**O que vai funcionar:**
- Ler todas as respostas do seu Forms direto no painel admin (cruzar com o token)
- Listar perguntas/estrutura
- Reconciliar: "respostas no Forms × tokens usados no app" — ver quem completou de verdade

**O que NÃO vai funcionar via API:**
- Editar texto de perguntas existentes do seu Forms (precisa ser feito manualmente no Google)
- Adicionar o campo "código de identificação" se ele não existir (manual)

### Edge Function `google-forms-sync`

- Roda sob demanda (botão no admin "Sincronizar respostas")
- Usa OAuth do connector via gateway Lovable
- Busca respostas do Form ID `1FAIpQLSfkK5RUJIZ6a95AGx7zHDJAKWo9a1_SSEVO9umV8l5idc5VHw`
- Cruza com `survey_responses.tracking_code` e marca `google_form_completed = true` automaticamente (substitui o botão manual "Finalizei")

## Detalhes técnicos

**Arquivos a criar:**
- `src/components/survey/TokenValidationStep.tsx`
- `src/components/admin/TokenManager.tsx` (aba nova no admin)
- `supabase/functions/google-forms-sync/index.ts`
- Migration: tabela `valid_tokens` + RPCs + insert do `UFTC-7RDHED`

**Arquivos a editar:**
- `src/pages/Index.tsx` — inserir etapa `tokenValidation` antes de `googleForm`, remover geração automática
- `src/lib/tracking-code.ts` — depreciar geração, manter apenas formatador
- `src/pages/Admin.tsx` — adicionar aba Tokens + botão sincronizar Forms
- `src/components/survey/GoogleFormStep.tsx` — não mostra mais "copie seu código", mostra "Use o token validado: UFTC-XXXXXX"

**Conexão necessária:** vou solicitar conexão do **Google Drive** (cobre Forms API). Você vai precisar autorizar com a conta dona do formulário.

## Resumo do que muda pra você

1. Você cadastra os tokens válidos no painel admin (começa com `UFTC-7RDHED`)
2. Distribui esses tokens aos participantes (cada um único)
3. Participante só consegue acessar o Forms se digitar um token válido e não usado
4. Painel admin sincroniza com Google Forms automaticamente

Aprova esse plano? Depois de aprovado eu implemento e já solicito a conexão Google.