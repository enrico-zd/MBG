"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getSelectedProjectId, getUserEmail, setSelectedProjectId, setUserEmail } from "@/lib/client/userPrefs";

type Project = { id: string; title: string };
type TemplatePack = { id: string; name: string };

type Quality = "360p" | "540p" | "720p" | "1080p";
type Tone = "friendly" | "professional" | "energetic";
type Language = "id" | "en";

export function AdJobNewClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [userEmail, setUserEmailState] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [templatePacks, setTemplatePacks] = useState<TemplatePack[]>([]);
  const [templatePackId, setTemplatePackId] = useState("ugc_promo");
  const [targetDurationSec, setTargetDurationSec] = useState<30 | 45>(30);
  const [quality, setQuality] = useState<Quality>("720p");
  const [language, setLanguage] = useState<Language>("id");
  const [tone, setTone] = useState<Tone>("friendly");
  const [productName, setProductName] = useState("Produk A");
  const [offer, setOffer] = useState("Diskon 20%");
  const [cta, setCta] = useState("Beli sekarang");
  const [benefitsText, setBenefitsText] = useState("Cepat\nMurah\nAman");
  const [targetAudience, setTargetAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => userEmail.includes("@") && projectId.length > 0, [userEmail, projectId]);

  useEffect(() => {
    const email = getUserEmail() || "demo@example.com";
    setUserEmailState(email);
    const qpProjectId = sp.get("projectId") || "";
    const savedProjectId = getSelectedProjectId() || "";
    setProjectId(qpProjectId || savedProjectId);
  }, []);

  async function loadProjects() {
    if (!userEmail.includes("@")) return;
    setError(null);
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
    }
  }

  async function loadPacks() {
    setError(null);
    try {
      const res = await fetch("/api/template-packs", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("failed");
      setTemplatePacks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "failed");
    }
  }

  useEffect(() => {
    if (userEmail.includes("@")) loadProjects();
  }, [userEmail]);

  useEffect(() => {
    loadPacks();
  }, []);

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const benefits = benefitsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/ad-jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userEmail,
          projectId,
          templatePackId,
          targetDurationSec,
          quality,
          params: {
            language,
            tone,
            productName,
            benefits,
            offer,
            cta,
            targetAudience: targetAudience.trim().length ? targetAudience.trim() : undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      const jobId = data?.adJob?.id;
      if (typeof jobId !== "string") throw new Error("missing_jobId");

      setUserEmail(userEmail);
      setSelectedProjectId(projectId);
      router.push(`/ad-jobs/${encodeURIComponent(jobId)}`);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
      <Card>
        <CardHeader title="Buat Ad Job" right={<span style={{ fontSize: 12, opacity: 0.75 }}>tema dark + ungu</span>} />
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
            <Field label="templatePack">
              <Select value={templatePackId} onChange={(e) => setTemplatePackId(e.target.value)}>
                {templatePacks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="duration">
                <Select
                  value={targetDurationSec}
                  onChange={(e) => setTargetDurationSec(Number(e.target.value) === 45 ? 45 : 30)}
                >
                  <option value={30}>30s</option>
                  <option value={45}>45s</option>
                </Select>
              </Field>
              <Field label="quality">
                <Select value={quality} onChange={(e) => setQuality(e.target.value as Quality)}>
                  <option value="360p">360p</option>
                  <option value="540p">540p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </Select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="language">
                <Select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                  <option value="id">id</option>
                  <option value="en">en</option>
                </Select>
              </Field>
              <Field label="tone">
                <Select value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                  <option value="friendly">friendly</option>
                  <option value="professional">professional</option>
                  <option value="energetic">energetic</option>
                </Select>
              </Field>
            </div>
            <Field label="productName">
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="offer">
                <Input value={offer} onChange={(e) => setOffer(e.target.value)} />
              </Field>
              <Field label="cta">
                <Input value={cta} onChange={(e) => setCta(e.target.value)} />
              </Field>
            </div>
            <Field label="benefits (1 per line)">
              <textarea
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 86,
                  borderRadius: 10,
                  padding: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "var(--text)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </Field>
            <Field label="targetAudience (opsional)">
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Contoh: ibu muda, mahasiswa, pekerja kantoran..."
              />
            </Field>
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button type="button" onClick={submit} disabled={!canSubmit || loading}>
                Generate Video
              </Button>
              <Button variant="secondary" type="button" onClick={() => router.push("/ad-jobs")} disabled={loading}>
                Kembali
              </Button>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Submit akan membuat AdJob + segments dan enqueue task{" "}
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                }}
              >
                pixverse.upload_image
              </span>
              .
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Catatan" />
        <CardBody>
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>
            <div>- Untuk MVP ini, sistem belum meminta pemilihan “asset utama” saat create AdJob.</div>
            <div>- Upload asset dilakukan di halaman Project Detail.</div>
            <div>- Setelah job dibuat, buka halaman status untuk memantau segment.</div>
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

