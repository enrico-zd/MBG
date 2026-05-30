import path from "node:path";

export function resolveUploadFilePath(uploadUrl: string) {
  const trimmed = uploadUrl.trim();
  if (!trimmed.startsWith("/uploads/")) throw new Error("invalid_upload_url");

  const publicDir = path.join(process.cwd(), "public");
  const uploadDir = path.join(publicDir, "uploads");
  const rel = trimmed.replace(/^\//, "");
  const candidate = path.join(publicDir, rel);

  const normalizedUploadDir = path.resolve(uploadDir) + path.sep;
  const normalizedCandidate = path.resolve(candidate);
  if (!normalizedCandidate.startsWith(normalizedUploadDir)) throw new Error("invalid_upload_url");

  return normalizedCandidate;
}

