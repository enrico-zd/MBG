"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getSelectedProjectId, getUserEmail, setSelectedProjectId, setUserEmail } from "@/lib/client/userPrefs";

type Project = { id: string; title: string; createdAt?: string; updatedAt?: string };

function isValidEmail(email: string) {
  return email.includes("@") && email.includes(".");
}

export function ProjectsClient() {
  const [userEmail, setUserEmailState] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = getUserEmail() || "demo@example.com";
    setUserEmailState(email);
    setSelectedId(getSelectedProjectId());
    void loadProjects(email);
  }, []);

  const canLoad = useMemo(() => isValidEmail(userEmail), [userEmail]);

  async function loadProjects(nextEmail = userEmail) {
    if (!isValidEmail(nextEmail)) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?userEmail=${encodeURIComponent(nextEmail)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
      setUserEmail(nextEmail);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!canLoad) return;
    const titleTrimmed = title.trim();
    if (titleTrimmed.length < 1) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userEmail, title: titleTrimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setTitle("");
      setUserEmail(userEmail);
      await loadProjects(userEmail);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "start" }}>
      <Card>
        <CardHeader
          title="Projects"
          right={
            <Button variant="secondary" type="button" onClick={() => loadProjects()} disabled={!canLoad || loading}>
              Refresh
            </Button>
          }
        />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="userEmail" hint="Email ini dipakai sebagai identitas user (MVP) dan disimpan di browser.">
              <Input value={userEmail} onChange={(e) => setUserEmailState(e.target.value)} placeholder="nama@contoh.com" />
            </Field>
            <Field label="Buat project">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nama project" />
                </div>
                <Button type="button" onClick={createProject} disabled={!canLoad || loading || title.trim().length < 1}>
                  Buat
                </Button>
              </div>
            </Field>
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
            {!canLoad ? <div style={{ fontSize: 12, color: "var(--muted)" }}>Masukkan email valid untuk memuat project.</div> : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Daftar Project" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{projects.length} items</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            {projects.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Belum ada project. Buat satu di panel kiri.</div>
            ) : (
              projects.map((p) => {
                const isSelected = p.id === selectedId;
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setSelectedId(p.id);
                    }}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(0,0,0,0.20)",
                      border: isSelected ? "1px solid rgba(124,92,255,0.45)" : "1px solid var(--border)",
                      boxShadow: isSelected ? "0 0 0 4px rgba(124,92,255,0.10)" : undefined,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{p.id}</div>
                    </div>
                    {isSelected ? <Badge tone="queued">Dipilih</Badge> : <span style={{ fontSize: 12, color: "var(--muted)" }}>Open</span>}
                  </Link>
                );
              })
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

