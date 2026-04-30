## Situação atual

Hoje o sistema gera um código tipo `UFTC-XXXXXX` (ex: `UFTC-7RDHED`) na etapa "Dados Pessoais" e mostra para o usuário copiar e colar dentro do Google Forms, no campo "Código de identificação".

**Problema:** não há nenhuma validação real — o usuário pode digitar qualquer coisa no Google Forms (ou nem preencher) e mesmo assim a resposta é aceita. O código gerado pelo site não está vinculado de forma obrigatória à submissão do Forms.

## O que você quer

Que **só seja considerada válida** a resposta do Google Forms cujo código de identificação seja **exatamente** o que o sistema gerou. Token errado/inventado → resposta inválida.

## Como o Google Forms funciona (limitação importante)

O Google Forms **não permite validação dinâmica server-side contra nosso banco** dentro do próprio formulário. Ele só valida formato (regex). Ou seja: não conseguimos fazer o Forms rejeitar um token inválido na hora do envio.

Existem duas formas viáveis de garantir que só o token correto vale:

### Opção A — Validação pós-envio (recomendada, simples)

1. Ao gerar o código no site, **gravamos ele como ativo** na tabela `valid_tokens` (já existe).
2. O usuário cola o código dentro do Google Forms.
3. Periodicamente (ou sob demanda no painel Admin), uma **edge function** lê as respostas do Google Forms via Google Sheets/Drive API (a service account já está configurada — `GOOGLE_SERVICE_ACCOUNT_JSON`) e:
   - Para cada resposta do Forms, pega o campo "Código de identificação".
   - Confere contra `valid_tokens` (existe? está ativo? não usado?).
   - Se válido → marca como `used_at` e vincula à `survey_responses`.
   - Se inválido → marca a resposta como **descartada/inválida** numa nova tabela `invalid_form_responses` (ou flag).
4. No painel Admin, mostramos só as respostas com token válido.

### Opção B — Validação prévia no site (mais rígida)

1. Antes de mostrar o botão "Abrir pesquisa", o usuário precisa **confirmar no site** que vai usar aquele código específico.
2. O código vai como parâmetro **pré-preenchido e travado** na URL do Google Forms (`entry.XXXX=UFTC-...`).
3. Isso reduz o risco de inventarem token, mas tecnicamente o usuário ainda pode editar manualmente. A validação real continua sendo a da Opção A no pós-envio.

**As duas opções se complementam.** Recomendo fazer ambas.

## Plano de implementação

### 1. Banco de dados (migração)
- Garantir que ao gerar o `tracking_code` no site ele seja inserido em `valid_tokens` como `is_active=true`. Hoje só é gerado client-side e salvo em `survey_responses.tracking_code`, mas **não** é registrado em `valid_tokens` — por isso a função `validate_and_consume_token` nunca encontra nada. Vamos:
  - Criar uma RPC `register_tracking_code(_code text, _response_id uuid)` que insere em `valid_tokens` (security definer).
  - Adicionar coluna `survey_responses.token_validated boolean default false` e `token_validated_at timestamptz`.

### 2. Frontend (`src/pages/Index.tsx`)
- Após gerar o `trackingCode`, chamar a nova RPC `register_tracking_code` para registrá-lo como ativo antes de liberar o Google Forms.

### 3. Edge function `sync-google-form-responses`
- Lê respostas do Google Forms (via Sheets API com service account).
- ID do Forms já configurado: `1FAIpQLSfkK5RUJIZ6a95AGx7zHDJAKWo9a1_SSEVO9umV8l5idc5VHw`.
- **Você precisa me informar:** o ID da planilha de respostas vinculada (Forms → Respostas → ícone do Sheets → URL contém `/d/SHEET_ID/`) **ou** compartilhar a planilha com o e-mail da service account para acesso.
- Para cada linha:
  - Extrai o campo "Código de identificação".
  - Chama `validate_and_consume_token(code, response_id)`.
  - Se válido → atualiza `survey_responses` com `token_validated=true` e copia respostas do Forms para `main_answers`.
  - Se inválido → grava em nova tabela `invalid_form_responses` (timestamp da resposta, código tentado, payload).

### 4. Painel Admin (`src/pages/Admin.tsx`)
- Botão "Sincronizar respostas do Google Forms" → chama a edge function.
- Filtro: mostrar só respostas com `token_validated=true` (válidas) por padrão; aba separada para "Tentativas inválidas".

### 5. Opcional — automação
- Cron na edge function (a cada 15 min) para sincronizar automaticamente, sem precisar clicar no botão.

## Detalhes técnicos

```text
Fluxo final:

[Site] gera UFTC-XXX → grava valid_tokens(is_active=true)
   │
   └─> survey_responses.insert (token_validated=false)
   │
   └─> usuário cola UFTC-XXX no Google Forms e envia
                         │
                         ▼
            [Edge Function de sync — manual ou cron]
                         │
                         ├─ token bate? → consome token + token_validated=true
                         └─ token não bate? → invalid_form_responses
```

## O que preciso de você antes de implementar

1. **Confirmar a abordagem** (Opção A + B juntas, recomendado).
2. **ID da planilha de respostas do Google Forms** OU me diga que você vai compartilhar a planilha com a service account (eu te passo o e-mail dela depois).
3. Quer **sincronização automática** (cron a cada 15 min) ou só **manual** via botão no Admin?