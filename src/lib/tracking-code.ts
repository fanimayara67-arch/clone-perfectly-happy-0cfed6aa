// Gera um código curto e legível tipo UFTC-A3F9K2
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I

export function generateTrackingCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
  return `UFTC-${suffix}`;
}
