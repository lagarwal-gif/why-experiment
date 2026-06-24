export function normalizeToE164(input: string): string {
  const cleaned = input.replace(/\D/g, "");
  if (cleaned.startsWith("1") && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  throw new Error("Invalid phone number format");
}
