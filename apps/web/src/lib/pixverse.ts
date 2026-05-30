type Envelope<T> = {
  ErrCode: number;
  ErrMsg: string;
  Resp: T;
};

type UploadResp = {
  img_id: number;
  img_url: string;
};

type GenerateResp = {
  video_id: number;
};

export type PixverseVideoResult = {
  status: number;
  url?: string;
  create_time?: number;
  modify_time?: number;
};

function baseUrl() {
  return (process.env.PIXVERSE_BASE_URL ?? "https://app-api.pixverse.ai/openapi/v2").replace(/\/$/, "");
}

function apiKey() {
  const key = process.env.PIXVERSE_API_KEY?.trim();
  if (!key) throw new Error("pixverse_api_key_missing");
  return key;
}

function traceId() {
  return crypto.randomUUID();
}

async function requestJson<T>(input: { path: string; init: RequestInit }) {
  const res = await fetch(`${baseUrl()}${input.path}`, {
    ...input.init,
    headers: {
      ...input.init.headers,
      "API-KEY": apiKey(),
      "Ai-trace-id": traceId(),
    },
  });

  const json = (await res.json()) as Envelope<T>;
  if (!res.ok) throw new Error(`pixverse_http_${res.status}`);
  if (!json || typeof json.ErrCode !== "number") throw new Error("pixverse_bad_response");
  if (json.ErrCode !== 0) throw new Error(`pixverse_${json.ErrCode}_${json.ErrMsg || "error"}`);

  return json.Resp;
}

async function requestForm<T>(input: { path: string; form: FormData }) {
  const res = await fetch(`${baseUrl()}${input.path}`, {
    method: "POST",
    headers: {
      "API-KEY": apiKey(),
      "Ai-trace-id": traceId(),
    },
    body: input.form,
  });

  const json = (await res.json()) as Envelope<T>;
  if (!res.ok) throw new Error(`pixverse_http_${res.status}`);
  if (!json || typeof json.ErrCode !== "number") throw new Error("pixverse_bad_response");
  if (json.ErrCode !== 0) throw new Error(`pixverse_${json.ErrCode}_${json.ErrMsg || "error"}`);

  return json.Resp;
}

function guessMime(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function uploadImageFromBuffer(input: { buffer: Buffer; filename: string }) {
  const form = new FormData();
  const bytes = new Uint8Array(input.buffer.byteLength);
  bytes.set(input.buffer);
  form.append("image", new Blob([bytes], { type: guessMime(input.filename) }), input.filename);
  const resp = await requestForm<UploadResp>({ path: "/image/upload", form });
  return { imageId: resp.img_id, imageUrl: resp.img_url };
}

export async function generateVideoFromImage(input: {
  imageId: number;
  prompt: string;
  model: string;
  duration: number;
  quality: string;
}) {
  const resp = await requestJson<GenerateResp>({
    path: "/video/img/generate",
    init: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        img_id: input.imageId,
        prompt: input.prompt,
        model: input.model,
        duration: input.duration,
        quality: input.quality,
      }),
    },
  });
  return { videoId: resp.video_id };
}

export async function getVideoResult(videoId: number) {
  const resp = await requestJson<PixverseVideoResult>({
    path: `/video/result/${videoId}`,
    init: { method: "GET" },
  });
  return resp;
}
