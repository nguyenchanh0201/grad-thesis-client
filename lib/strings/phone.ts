export function formatPhoneNumber(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+84") && cleaned.length === 12) {
    return `+84 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  if (cleaned.startsWith("84") && cleaned.length === 11) {
    return `+84 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
}
