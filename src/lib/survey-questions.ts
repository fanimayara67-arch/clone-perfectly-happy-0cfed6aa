export type QuestionType = "yesno" | "single" | "multi" | "likert" | "text";

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
}

export const SCREENING_QUESTIONS: Question[] = [];

export const MAIN_QUESTIONS: Question[] = [
  {
    id: "q_1",
    label: "1- Percebo redução de volume na região do rosto após o uso de agonistas de GLP-1",
    type: "likert",
    required: true,
  },
  {
    id: "q_2",
    label: "2- Percebo maior evidência de marcas de expressão ou aspecto envelhecido após o uso do medicamento",
    type: "likert",
    required: true,
  },
  {
    id: "q_3",
    label: "3- Percebo alterações no contorno corporal após o emagrecimento associado ao uso do agonista de GLP-1",
    type: "likert",
    required: true,
  },
  {
    id: "q_4",
    label: "4- Percebo alterações na firmeza, elasticidade ou aspecto da pele após o início do uso de agonistas de GLP-1",
    type: "likert",
    required: true,
  },
  {
    id: "q_5",
    label: "5- Percebo alterações estéticas que não esperava apresentar após o uso do medicamento",
    type: "likert",
    required: true,
  },
  {
    id: "q_6",
    label: "6- As alterações percebidas após o uso do agonista de GLP-1 influenciaram a forma como percebo minha imagem corporal",
    type: "likert",
    required: true,
  },
  {
    id: "q_7",
    label: "7- Percebo que meu rosto perdeu harmonia ou proporção entre as regiões após o uso de agonistas de GLP-1",
    type: "likert",
    required: true,
  },
  {
    id: "q_8",
    label: "8- Percebo desconforto com alguma mudança estética ocorrida após o uso de agonistas de GLP-1",
    type: "likert",
    required: true,
  },
  {
    id: "q_9",
    label: "9- Percebo que áreas específicas do meu corpo perderam volume de forma desproporcional após o uso do agonista de GLP-1",
    type: "likert",
    required: true,
  },
  {
    id: "q_10",
    label: "10- Percebo que a estrutura óssea do meu rosto ficou mais evidente após o emagrecimento com o agonista de GLP-1",
    type: "likert",
    required: true,
  },
  {
    id: "q_11",
    label: "11- Caso tenha percebido alterações em sua aparência após o uso de agonistas de GLP-1, descreva quais mudanças faciais e/ou corporais você identificou.",
    type: "text",
    required: false,
  },
  {
    id: "comments",
    label: "Comentário opcional: utilize este espaço caso queira relatar algo que não foi contemplado nas questões anteriores.",
    type: "text",
    required: false,
  },
];

export const LIKERT_OPTIONS = [
  "1 — Discordo totalmente",
  "2 — Discordo parcialmente",
  "3 — Nem concordo nem discordo",
  "4 — Concordo parcialmente",
  "5 — Concordo totalmente",
];
