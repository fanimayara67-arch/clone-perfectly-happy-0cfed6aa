## Ajustes solicitados

### 1. Tela final (SuccessStep)
Manter apenas o card verde com **"Obrigado pela participação!"** e o subtítulo. Remover:
- Card "Sobre o Estudo" (Instituição / Curso / Tema)
- Card "Autores e Orientação"
- Botão "Iniciar nova resposta"
- Rodapé "© UNIFTC — Pesquisa Acadêmica"

Arquivo: `src/components/survey/SuccessStep.tsx` (simplificar para renderizar apenas o hero).

### 2. Termo de Consentimento (ConsentStep)
No parágrafo final do TCLE ("Eu, [nome]…"), cortar o texto após **"se assim o desejar."** Será removida a frase:

> "Declaro que concordo em participar. Recebi uma via deste termo de consentimento livre e esclarecido e me foi dada à oportunidade de ler e esclarecer as minhas dúvidas."

Arquivo: `src/components/survey/ConsentStep.tsx` (linha ~105).

### 3. Dados Pessoais (PersonalDataStep)
- Remover o campo **"Orientação sexual"** (deixar apenas Gênero).
- Remover o campo **"Nome completo"**.

Arquivo: `src/components/survey/PersonalDataStep.tsx`
- Remove `full_name` e `sexual_orientation` do schema Zod, do JSX e dos defaults.
- `src/lib/google-forms.ts` e `src/pages/Index.tsx`: remover referências a `full_name` (sexual_orientation já foi removido em ajuste anterior do mapeamento Google, manterei consistente).

### Observação
Nada mais é alterado (sincronização Google, demais etapas, RLS, etc. permanecem).
