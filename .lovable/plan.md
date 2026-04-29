# Painel Administrativo com Monitoramento em Tempo Real

## Esclarecendo a sua dúvida sobre "quem preencheu o quê"

Hoje o fluxo já funciona assim:

```text
Etapa 1 (Termo) → Etapa 2 (Critérios) → Etapa 3 (Dados Pessoais)
                                              ↓
                                  SALVA no Supabase (survey_responses)
                                              ↓
Etapa 4 (Google Forms) ← embedado, mas as respostas ficam no Google
                                              ↓
Etapa 5 (Sucesso)
```

**O problema real**: o Google Forms é um sistema externo do Google, então as respostas dele NÃO estão no nosso banco — ficam na planilha do Google. Para correlacionar quem é quem, vamos:

1. Gerar um **código único** (ex.: `UFTC-A3F9K2`) para cada pessoa quando ela termina os Dados Pessoais
2. Mostrar esse código bem destacado na tela do Google Forms e instruir a pessoa a digitar ele em um campo "Código de identificação" do formulário Google
3. Salvar esse mesmo código no Supabase junto com os dados pessoais
4. No painel, você vê os dados pessoais + o código → cruza com a planilha do Google Forms pelo código

Assim você sabe exatamente: "essa linha do Google Forms (código UFTC-A3F9K2) é o João Silva, 28 anos, de Salvador".

## O que vai ser construído

### 1. Sistema de autenticação para admins
- Tela de login em `/admin/login` (email + senha)
- Tabela `user_roles` com enum `app_role` (`admin`) — segura, sem privilege escalation
- Função `has_role()` SECURITY DEFINER
- Apenas admins acessam o painel; qualquer outro usuário é bloqueado
- Você cadastra seu email manualmente como admin via SQL após o primeiro signup

### 2. Mudança no schema (migration)
- Adicionar coluna `tracking_code` (text, único) na tabela `survey_responses`
- Adicionar coluna `google_form_completed` (boolean, default false) — marca quando a pessoa clicou em "Finalizei o Google Forms"
- Adicionar coluna `google_form_completed_at` (timestamp)
- Atualizar policy de SELECT para exigir role admin (mais seguro que "qualquer autenticado")
- Habilitar realtime na tabela: `ALTER PUBLICATION supabase_realtime ADD TABLE survey_responses`

### 3. Mudanças no fluxo da pesquisa
- Ao salvar dados pessoais, gerar `tracking_code` curto e legível (formato `UFTC-XXXXXX`)
- Na tela do Google Forms, exibir um **card destacado** com o código + botão "Copiar código"
- Texto claro: "Cole este código no campo 'Código de identificação' dentro do Google Forms antes de enviar"
- Quando a pessoa clica em "Finalizei o Google Forms", atualizar `google_form_completed = true` no banco

### 4. Painel admin em `/admin`
**Layout**: sidebar com navegação + área principal

**Cards de estatísticas no topo (ao vivo)**:
- Total de cadastros
- Concluíram Google Forms
- Pendentes (cadastraram mas não finalizaram)
- Cadastros nas últimas 24h

**Tabela principal de respostas** com:
- Código de tracking (destaque, copiável)
- Nome, idade, gênero
- Cidade / Estado
- Telefone, email
- Status do Google Forms (badge verde "Concluído" / amarelo "Pendente")
- Data/hora do cadastro
- Botão "Ver detalhes" → abre modal com TODOS os campos (CEP, rua, número, bairro, nacionalidade, dados do termo de consentimento)

**Filtros**:
- Buscar por nome / código / email
- Filtrar por status (todos / concluídos / pendentes)
- Filtrar por intervalo de datas
- Filtrar por cidade/estado

**Exportação**:
- Botão "Exportar CSV" — baixa todos os dados filtrados para você cruzar com a planilha do Google Forms

**Tempo real (sem refresh)**:
- Subscription do Supabase Realtime na tabela
- Quando alguém cadastra → linha aparece no topo da tabela com animação de destaque
- Quando alguém finaliza Google Forms → badge muda de "Pendente" para "Concluído" automaticamente
- Toast de notificação: "Nova resposta de João Silva"
- Stats no topo recalculam sozinhos

### 5. Página "Como cruzar com o Google Forms"
Pequena página de ajuda explicando:
- Onde está o link da planilha de respostas do Google Forms
- Como filtrar pela coluna "Código de identificação"
- Como combinar com os dados do painel

## Detalhes técnicos

**Stack**: Supabase Auth (email/senha), Supabase Realtime, React Router (rota protegida), TanStack Query, shadcn Table/Dialog/Sidebar.

**Segurança**:
- RLS em `survey_responses`: SELECT apenas se `has_role(auth.uid(), 'admin')`
- INSERT continua aberto para anon (pesquisa pública)
- UPDATE permitido para anon apenas no campo `google_form_completed` via RPC restrita (ou mantemos UPDATE aberto só para esse marcador) — vou usar RPC para ser estrito
- Roles em tabela separada (`user_roles`), nunca em profiles
- `tracking_code` gerado client-side com `crypto.getRandomValues` em formato curto

**Realtime**:
```typescript
supabase.channel('admin-survey')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_responses' }, handler)
  .subscribe()
```

**Rotas adicionadas**:
- `/admin/login` — pública
- `/admin` — protegida (admin only) → dashboard
- `/admin/responses/:id` — modal/página de detalhes

## ⚠️ Pergunta importante antes de implementar

**Para o login admin funcionar, eu vou precisar configurar autenticação por email/senha.**

Por padrão o Supabase exige confirmação de email (você recebe um link no seu email antes de poder logar). Você quer:

- **(A)** Confirmação de email ATIVADA (mais seguro, padrão) — você precisa clicar no link do email após criar a conta admin
- **(B)** Confirmação DESATIVADA (mais rápido para testes) — login imediato após signup

Posso seguir com **(A)** por padrão se você não responder. E após você criar sua conta no `/admin/login`, eu te passo o SQL exato para você rodar e virar admin (algo como `INSERT INTO user_roles (user_id, role) VALUES ('seu-uuid', 'admin')`).

Se aprovar, eu implemento tudo de uma vez.