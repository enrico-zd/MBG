import crypto from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getAuth } from "@/lib/auth/session";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_COUNT = 5;

const mimeToExtension: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function resolveUploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.UPLOAD_DIR);
}

function urlPathForFile(uploadDirAbs: string, filename: string) {
  const publicDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "public");

  if (!uploadDirAbs.startsWith(`${publicDir}${path.sep}`) && uploadDirAbs !== publicDir) {
    throw new Error("UPLOAD_DIR must be inside ./public to be served as static file");
  }

  const relativeDir = path
    .relative(publicDir, uploadDirAbs)
    .split(path.sep)
    .filter(Boolean)
    .join("/");

  return relativeDir
    ? path.posix.join("/", relativeDir, filename)
    : path.posix.join("/", filename);
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, error: "Invalid multipart form data" }, { status: 400 });
  }

  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "No images provided" }, { status: 400 });
  }

  if (files.length > MAX_FILE_COUNT) {
    return NextResponse.json(
      { ok: false, error: `Max ${MAX_FILE_COUNT} images` },
      { status: 400 },
    );
  }

  const uploadDirAbs = resolveUploadDir();
  await mkdir(uploadDirAbs, { recursive: true });

  const urlPaths: string[] = [];

  for (const file of files) {
    const extension = mimeToExtension[file.type];
    if (!extension) {
      return NextResponse.json(
        { ok: false, error: "Invalid image type. Only png/jpeg/webp allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Image too large. Max 5MB." },
        { status: 400 },
      );
    }

    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
    const filePathAbs = path.join(uploadDirAbs, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePathAbs, buffer);

    urlPaths.push(urlPathForFile(uploadDirAbs, filename));
  }

  return NextResponse.json({ ok: true, urlPaths });
}
