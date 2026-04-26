export function generateSlug(title: string): string {
  return title
    .replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
