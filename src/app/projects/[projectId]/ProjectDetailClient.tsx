"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { getUserEmail, setSelectedProjectId } from "@/lib/client/userPrefs";

type Asset = { id: string; createdAt?: string; mimeType?: string; width?: number; height?: number; sizeBytes?: string | number };
type Project = { id: string; title: string; assets?: Asset[] };

function formatSizeBytes(sizeBytes: Asset["sizeBytes"]) {
  if (typeof sizeBytes === "string") return sizeBytes;
  if (typeof sizeBytes === "number") return sizeBytes.toString();
  return "";
}

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [userEmail, setUserEmailState] = useState("");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    setUserEmailState(getUserEmail() || "demo@example.com");
    setSelectedProjectId(projectId);
  }, [projectId]);

  const assets = useMemo(() => (Array.isArray(project?.assets) ? project.assets : []), [project?.assets]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setProject(data?.project || null);
      setTitle(typeof data?.project?.title === "string" ? data.project.title : "");
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function rename() {
    if (title.trim().length < 1) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      await load();
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function upload() {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/assets`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setFile(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [projectId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "start" }}>
      <Card>
        <CardHeader
          title="Project Detail"
          right={
            <Button variant="secondary" type="button" onClick={load} disabled={loading}>
              Refresh
            </Button>
          }
        />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="projectId">
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                }}
              >
                {projectId}
              </div>
            </Field>
            <Field label="Title">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <Button type="button" onClick={rename} disabled={loading || title.trim().length < 1}>
                  Simpan
                </Button>
              </div>
            </Field>
            <Field label="Upload asset gambar" hint="Sistem akan menyimpan original + derived 9:16 JPG untuk PixVerse.">
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ color: "var(--muted)" }}
                />
                <Button type="button" onClick={upload} disabled={loading || !file}>
                  Upload
                </Button>
              </div>
            </Field>
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/projects">
                <Button variant="secondary" type="button">
                  Kembali
                </Button>
              </Link>
              <Link href={`/ad-jobs/new?projectId=${encodeURIComponent(projectId)}`}>
                <Button type="button" disabled={!userEmail.includes("@")}>
                  Buat Ad Job
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Assets" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{assets.length} items</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            {assets.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Belum ada asset. Upload minimal 1 gambar.</div>
            ) : (
              assets.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.20)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>asset_{a.id.slice(0, 6)}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {a.mimeType || "image"} • {a.width || "?"}×{a.height || "?"} • {formatSizeBytes(a.sizeBytes)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

