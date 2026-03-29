export function formatDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}
