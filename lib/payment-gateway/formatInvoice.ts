export function formatInvoiceId(id: string, maxLen = 22): string {
  if (id.length <= maxLen) return id;
  const keep = Math.floor((maxLen - 3) / 2);
  return `${id.slice(0, keep)}...${id.slice(-keep)}`;
}

export function formatDeadline(date: Date): string {
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${year} at ${hh}:${mm}`;
}
