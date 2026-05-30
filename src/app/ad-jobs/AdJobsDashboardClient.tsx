"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { getSelectedProjectId, getUserEmail, setSelectedProjectId, setUserEmail } from "@/lib/client/userPrefs";

type Project = { id: string; title: string };
type Segment = { id: string; segmentIndex: number; status: string };
type AdJob = {
  id: string;
  status: string;
  targetDurationSec: number;
  quality: string;
  templatePackId: string;
  estimatedPixverseCredits?: number;
  segments?: Segment[];
};

export function AdJobsDashboardClient() {
  const [userEmail, setUserEmailState] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [adJobs, setAdJobs] = useState<AdJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserEmailState(getUserEmail() || "demo@example.com");
    setProjectId(getSelectedProjectId() || "");
  }, []);

  const canLoadProjects = useMemo(() => userEmail.includes("@"), [userEmail]);
  const canLoadJobs = useMemo(() => userEmail.includes("@") && projectId.length > 0, [userEmail, projectId]);

  async function loadProjects() {
    if (!canLoadProjects) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?userEmail=${encodeURIComponent(userEmail)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      const list = Array.isArray(data?.projects) ? data.projects : [];
      setProjects(list);
      setUserEmail(userEmail);
      if (!projectId && list[0]?.id) {
        setProjectId(list[0].id);
        setSelectedProjectId(list[0].id);
      }
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs() {
    if (!canLoadJobs) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/ad-jobs?projectId=${encodeURIComponent(projectId)}&userEmail=${encodeURIComponent(userEmail)}`,
        {
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setAdJobs(Array.isArray(data?.adJobs) ? data.adJobs : []);
      setSelectedProjectId(projectId);
      setUserEmail(userEmail);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userEmail.includes("@")) loadProjects();
  }, [userEmail]);

  useEffect(() => {
    if (canLoadJobs) loadJobs();
  }, [projectId]);

  function badgeTone(status: string) {
    if (status === "queued") return "queued";
    if (status === "running") return "running";
    if (status === "done") return "done";
    return "neutral";
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
      <Card>
        <CardHeader
          title="Ad Jobs"
          right={
            <Button variant="secondary" type="button" onClick={loadJobs} disabled={!canLoadJobs || loading}>
              Refresh
            </Button>
          }
        />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="userEmail">
              <Input value={userEmail} onChange={(e) => setUserEmailState(e.target.value)} />
            </Field>
            <Field label="project">
              <Select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setSelectedProjectId(e.target.value);
                }}
              >
                <option value="" disabled>
                  Pilih project
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/projects">
                <Button variant="secondary" type="button">
                  Kelola Projects
                </Button>
              </Link>
              <Link href={projectId ? `/ad-jobs/new?projectId=${encodeURIComponent(projectId)}` : "/ad-jobs/new"}>
                <Button type="button" disabled={!userEmail.includes("@")}>
                  Buat Ad Job
                </Button>
              </Link>
            </div>
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Dashboard ini menampilkan jobs untuk project terpilih.
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Jobs (Recent)" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{adJobs.length} items</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            {!canLoadJobs ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Pilih email dan project untuk melihat jobs.</div>
            ) : adJobs.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Belum ada ad job untuk project ini.</div>
            ) : (
              adJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/ad-jobs/${j.id}`}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.20)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div
                      style={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                        fontSize: 12,
                        opacity: 0.9,
                      }}
                    >
                      {j.id}
                    </div>
                    <Badge tone={badgeTone(j.status)}>{j.status}</Badge>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "var(--muted)" }}>
                    <span>{j.targetDurationSec}s</span>
                    <span>{j.quality}</span>
                    <span>{j.templatePackId}</span>
                    <span>
                      credits est: {typeof j.estimatedPixverseCredits === "number" ? j.estimatedPixverseCredits : "-"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 420px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
