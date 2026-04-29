# Clonar projeto `todo-kako-clone` idêntico

Vou replicar exatamente o projeto enviado no zip — uma pesquisa multi-etapas (estudo GLP-1 / UNIFTC) com integração Supabase — sem alterações no conteúdo, layout, estilos ou lógica.

## O que será copiado (sem modificações)

**Páginas e fluxo (`src/pages/Index.tsx`)**
- Fluxo de etapas: Termo de Consentimento → Critérios de Elegibilidade → Dados Pessoais → Google Forms → Sucesso (ou tela "Declined")
- Stepper com 5 passos: Termo, Critérios, Dados, Google Forms, Fim
- Persistência em localStorage (chave `uniftc-glp1-survey-v2`), scroll-to-top entre etapas, navegação Voltar/Avançar

**Componentes do survey (`src/components/survey/`)** — copiados na íntegra:
- `ConsentStep.tsx`, `EligibilityStep.tsx`, `PersonalDataStep.tsx`, `GoogleFormStep.tsx`, `SuccessStep.tsx`, `DeclinedStep.tsx`
- `QuestionCard.tsx`, `QuestionsStep.tsx`, `Stepper.tsx`
- `NavLink.tsx`

**Estilos e configuração**
- `index.css`, `App.css`, `tailwind.config.ts`, `postcss.config.js` — exatamente como no original
- `package.json` com as mesmas dependências (react-hook-form, zod, sonner, date-fns, lucide-react, etc.)
- Componentes shadcn/ui já presentes no projeto atual são reutilizados

**Backend (Lovable Cloud / Supabase)**
- Habilitar Lovable Cloud
- Aplicar a migration original criando a tabela `survey_responses` com:
  - Campos: `full_name`, `age`, `nationality`, `cep`, `street`, `number`, `neighborhood`, `city`, `state`, `gender`, `phone`, `email`, `screening_answers` (JSONB), `main_answers` (JSONB), `consent_given`, `created_at`
  - RLS habilitado
  - Policy: qualquer um (anon/authenticated) pode inserir respostas
  - Policy: apenas autenticados podem ler
  - Índice em `created_at DESC`
- Cliente Supabase (`src/integrations/supabase/client.ts`) e tipos (`types.ts`) gerados automaticamente pelo Lovable Cloud

**Assets públicos**
- `public/favicon.ico`, `public/placeholder.svg`, `public/robots.txt`

## Detalhes técnicos

- Stack: já compatível (Vite + React 18 + TS + Tailwind + shadcn) — sem mudança de versões
- Os arquivos do `src/integrations/supabase/` originais serão substituídos pelos gerados pelo Lovable Cloud (URL/keys próprios), mas a API consumida pelo `Index.tsx` é a mesma (`supabase.from('survey_responses').insert(...)`), então funciona sem editar o componente
- Migration SQL aplicada via arquivo de migration novo no projeto

## Resultado esperado

- Mesma UI, mesmo fluxo, mesmas validações (zod), mesmos textos
- Submissão grava em `survey_responses` no banco do projeto novo
- Sem erros de build/runtime
