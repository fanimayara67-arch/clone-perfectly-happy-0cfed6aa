import type { PersonalData } from "@/components/survey/PersonalDataStep";

export type AnswerMap = Record<string, string | string[]>;

type GoogleFormPayload = {
  personal: PersonalData;
  trackingCode: string;
  screening: AnswerMap;
  main: AnswerMap;
};

type EntryMap = Record<string, string>;

export const GOOGLE_FORM_ID = "1FAIpQLSfkK5RUJIZ6a95AGx7zHDJAKWo9a1_SSEVO9umV8l5idc5VHw";
export const GOOGLE_FORM_URL = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/viewform`;

const GOOGLE_FORM_ENTRIES: EntryMap = {
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

const appendValue = (body: URLSearchParams, entryId: string, value?: string | number | string[] | null) => {
  if (!entryId || value === undefined || value === null || value === "") return;

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item) body.append(`entry.${entryId}`, item);
    });
    return;
  }

  body.append(`entry.${entryId}`, String(value));
};

const appendAnswerMap = (body: URLSearchParams, answers: AnswerMap) => {
  Object.entries(answers).forEach(([questionId, value]) => {
    appendValue(body, GOOGLE_FORM_ENTRIES[questionId], value);
  });
};

export const isGoogleFormsConfigured = () =>
  Boolean(GOOGLE_FORM_ID) &&
  Object.values(GOOGLE_FORM_ENTRIES).every((entryId) => Boolean(entryId));

export const submitToGoogleForms = async ({ trackingCode, screening, main }: GoogleFormPayload) => {
  if (!isGoogleFormsConfigured()) {
    throw new Error("Google Forms não está configurado.");
  }

  const body = new URLSearchParams();
  appendValue(body, GOOGLE_FORM_ENTRIES.tracking_code, trackingCode);
  appendAnswerMap(body, screening);
  appendAnswerMap(body, main);

  await fetch(`https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return { skipped: false };
};
