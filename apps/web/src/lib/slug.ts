export function slugify(input: string) {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "campaign";
}

export function uniqueSlug(input: { title: string; suffix?: string }) {
  const suffix = input.suffix?.trim() ? `-${input.suffix.trim().toLowerCase()}` : "";
  return `${slugify(input.title)}${suffix}`;
}

