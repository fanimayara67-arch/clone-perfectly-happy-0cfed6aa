// Perguntas do formulário — placeholders editáveis
// Tipos: 'yesno' | 'single' | 'multi' | 'likert' | 'text'

export type QuestionType = "yesno" | "single" | "multi" | "likert" | "text";

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
}

// PARTE 1 — Triagem (até 20 perguntas — placeholders editáveis)
// Substitua o `label` de cada pergunta pelo texto definitivo do TCC.
export const SCREENING_QUESTIONS: Question[] = Array.from({ length: 20 }).map(
  (_, i) => ({
    id: `s_${i + 1}`,
    label: `[Pergunta ${i + 1} da triagem — substituir pelo texto do TCC]`,
    type: "single",
    options: ["Sim", "Não", "Não sei / Prefiro não responder"],
    required: true,
  }),
);

// PARTE 3 — Perguntas principais (Conhecimento + Estética)
export const MAIN_QUESTIONS: Question[] = [
  {
    id: "knowledge_heard",
    label:
      "Você já ouviu falar dos medicamentos agonistas de GLP-1 (Ozempic®, Wegovy®, Mounjaro®, Saxenda®)?",
    type: "single",
    options: ["Sim, conheço bem", "Já ouvi falar", "Não conheço"],
    required: true,
  },
  {
    id: "knowledge_source",
    label: "Onde você obteve informações sobre esses medicamentos? (marque todas que se aplicam)",
    type: "multi",
    options: [
      "Profissional de saúde (médico, dentista, nutricionista)",
      "Redes sociais (Instagram, TikTok, YouTube)",
      "Televisão / jornais / revistas",
      "Amigos e familiares",
      "Bula ou site do fabricante",
      "Nunca busquei informação",
    ],
    required: true,
  },
  {
    id: "knowledge_purpose",
    label: "Qual a finalidade principal desses medicamentos, segundo seu conhecimento?",
    type: "single",
    options: [
      "Tratamento de diabetes tipo 2",
      "Emagrecimento estético",
      "Ambos",
      "Não sei",
    ],
    required: true,
  },
  {
    id: "use_personal",
    label: "Você já utilizou algum desses medicamentos?",
    type: "single",
    options: [
      "Sim, com prescrição médica",
      "Sim, sem prescrição médica",
      "Não, mas considero usar",
      "Não e não pretendo",
    ],
    required: true,
  },
  {
    id: "use_known_person",
    label: "Você conhece alguém próximo que utilizou esses medicamentos?",
    type: "yesno",
    required: true,
  },
  {
    id: "facial_term_known",
    label:
      "Você já ouviu falar do termo \"face de Ozempic\" (alterações faciais associadas ao uso do medicamento)?",
    type: "yesno",
    required: true,
  },
  {
    id: "facial_perception",
    label:
      "Em sua percepção, o uso desses medicamentos pode causar envelhecimento facial precoce, flacidez ou perda de volume?",
    type: "likert",
    required: true,
  },
  {
    id: "facial_observed",
    label:
      "Você observou alterações faciais (flacidez, olheiras, perda de volume) em pessoas que usaram o medicamento?",
    type: "single",
    options: ["Sim, claramente", "Sim, sutilmente", "Não observei", "Não conheço usuários"],
    required: true,
  },
  {
    id: "body_perception",
    label:
      "Em sua percepção, o uso desses medicamentos pode causar flacidez corporal e perda de massa muscular?",
    type: "likert",
    required: true,
  },
  {
    id: "body_observed",
    label: "Você observou alterações corporais (flacidez de pele, perda muscular) em usuários?",
    type: "single",
    options: ["Sim, claramente", "Sim, sutilmente", "Não observei", "Não conheço usuários"],
    required: true,
  },
  {
    id: "safety_opinion",
    label: "Você considera o uso desses medicamentos seguro para fins estéticos de emagrecimento?",
    type: "likert",
    required: true,
  },
  {
    id: "would_recommend",
    label: "Você recomendaria o uso desses medicamentos para emagrecimento a alguém próximo?",
    type: "single",
    options: [
      "Sim, em qualquer caso",
      "Apenas com indicação médica",
      "Não recomendaria",
      "Não sei opinar",
    ],
    required: true,
  },
  {
    id: "complementary_treatment",
    label:
      "Caso utilizasse o medicamento, faria tratamentos estéticos complementares (preenchimento, bioestimuladores, harmonização orofacial)?",
    type: "single",
    options: ["Certamente sim", "Provavelmente sim", "Provavelmente não", "Certamente não"],
    required: true,
  },
  {
    id: "dentist_role",
    label:
      "Você acredita que o cirurgião-dentista (especialmente em Harmonização Orofacial) tem papel relevante no manejo das alterações faciais causadas por esses medicamentos?",
    type: "likert",
    required: true,
  },
  {
    id: "comments",
    label: "Comentários adicionais (opcional):",
    type: "text",
    required: false,
  },
];

export const LIKERT_OPTIONS = [
  "Discordo totalmente",
  "Discordo parcialmente",
  "Neutro",
  "Concordo parcialmente",
  "Concordo totalmente",
];
