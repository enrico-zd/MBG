"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getUserEmail } from "@/lib/client/userPrefs";

type Segment = {
  id: string;
  segmentIndex: number;
  durationSec: number;
  status: string;
  pixverseImgId?: string | null;
  pixverseVideoId?: string | null;
  pixverseStatus?: number | null;
  promptFinal?: string | null;
  segmentVideoPath?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
};

type AdJob = {
  id: string;
  status: string;
  targetDurationSec: number;
  quality: string;
  templatePackId: string;
  estimatedPixverseCredits?: number;
  createdAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  segments?: Segment[];
};

function isTerminalJobStatus(status: string) {
  return status === "done" || status === "failed" || status === "cancelled";
}

function badgeTone(status: string) {
  if (status === "queued") return "queued";
  if (status === "running" || status === "uploading" || status === "generating" || status === "polling") return "running";
  if (status === "done") return "done";
  return "neutral";
}

function segmentPercent(status: string) {
  if (status === "queued") return 5;
  if (status === "uploading") return 25;
  if (status === "generating") return 55;
  if (status === "polling") return 80;
  if (status === "done") return 100;
  if (status === "failed") return 100;
  return 0;
}

function fmtDate(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID");
}

export function AdJobDetailClient({ jobId }: { jobId: string }) {
  const [userEmail, setUserEmail] = useState("");
  const [adJob, setAdJob] = useState<AdJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    setUserEmail(getUserEmail() || "demo@example.com");
  }, []);

  const canLoad = useMemo(() => userEmail.includes("@") && jobId.length > 0, [userEmail, jobId]);

  const progress = useMemo(() => {
    const segments = adJob?.segments || [];
    const total = segments.length;
    if (adJob?.status === "done") return 100;
    if (total === 0) return 0;
    const doneCount = segments.filter((s) => s.status === "done").length;
    return Math.round((doneCount / total) * 100);
  }, [adJob]);

  async function loadOnce() {
    if (!canLoad || inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/ad-jobs/${encodeURIComponent(jobId)}?userEmail=${encodeURIComponent(userEmail)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setAdJob((data?.adJob as AdJob) || null);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }

  useEffect(() => {
    if (canLoad) loadOnce();
  }, [canLoad]);

  useEffect(() => {
    if (!canLoad) return;
    if (isTerminalJobStatus(adJob?.status || "")) return;

    const id = window.setInterval(() => {
      loadOnce();
    }, 2000);

    return () => window.clearInterval(id);
  }, [canLoad, adJob?.status]);

  const segments = adJob?.segments || [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
      <Card>
        <CardHeader
          title="Ad Job Detail"
          right={
            <Button variant="secondary" type="button" onClick={loadOnce} disabled={!canLoad || loading}>
              Refresh
            </Button>
          }
        />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                fontSize: 12,
                opacity: 0.9,
                overflowWrap: "anywhere",
              }}
            >
              {jobId}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Status</div>
              <Badge tone={badgeTone(adJob?.status || "neutral")}>{adJob?.status || "-"}</Badge>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Progress</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{progress}%</div>
              </div>
              <ProgressBar value={progress} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "var(--muted)" }}>
              <span>{typeof adJob?.targetDurationSec === "number" ? `${adJob.targetDurationSec}s` : "-"}</span>
              <span>{adJob?.quality || "-"}</span>
              <span>{adJob?.templatePackId || "-"}</span>
              <span>credits est: {typeof adJob?.estimatedPixverseCredits === "number" ? adJob.estimatedPixverseCredits : "-"}</span>
            </div>

            <div style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--muted)" }}>
              <div>createdAt: {fmtDate(adJob?.createdAt)}</div>
              <div>startedAt: {fmtDate(adJob?.startedAt)}</div>
              <div>finishedAt: {fmtDate(adJob?.finishedAt)}</div>
            </div>

            {adJob?.failureMessage ? (
              <div style={{ color: "#ff8a8a", fontSize: 12, lineHeight: 1.5 }}>{adJob.failureMessage}</div>
            ) : null}
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/ad-jobs">
                <Button variant="secondary" type="button">
                  Kembali
                </Button>
              </Link>
            </div>

            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Polling otomatis setiap 2 detik sampai status terminal.
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Segments" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{segments.length} items</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            {!canLoad ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Menunggu userEmail & jobId.</div>
            ) : !adJob ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading...</div>
            ) : segments.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Job ini belum punya segment.</div>
            ) : (
              segments.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.20)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>Segment {s.segmentIndex}</div>
                    <Badge tone={badgeTone(s.status)}>{s.status}</Badge>
                  </div>

                  <ProgressBar value={segmentPercent(s.status)} />

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "var(--muted)" }}>
                    <span>{s.durationSec}s</span>
                    <span>pixverseImgId: {s.pixverseImgId || "-"}</span>
                    <span>pixverseVideoId: {s.pixverseVideoId || "-"}</span>
                    <span>pixverseStatus: {typeof s.pixverseStatus === "number" ? s.pixverseStatus : "-"}</span>
                  </div>

                  {s.segmentVideoPath ? (
                    <div style={{ fontSize: 12, color: "var(--muted)", overflowWrap: "anywhere" }}>
                      segmentVideoPath: {s.segmentVideoPath}
                    </div>
                  ) : null}

                  {s.failureMessage ? (
                    <div style={{ color: "#ff8a8a", fontSize: 12, lineHeight: 1.5 }}>{s.failureMessage}</div>
                  ) : null}
                </div>
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

