import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files");

  if (!files.length) return NextResponse.json({ error: "files_required" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];

  for (const item of files) {
    if (!(item instanceof File)) continue;
    if (!ALLOWED.has(item.type)) {
      return NextResponse.json({ error: "file_type_not_allowed" }, { status: 400 });
    }
    if (item.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }

    const ext =
      item.type === "image/png" ? "png" : item.type === "image/webp" ? "webp" : "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await item.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    urls.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}

