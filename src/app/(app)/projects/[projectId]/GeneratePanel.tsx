"use client"

import { useEffect, useMemo, useState } from "react"
import { quoteCredits, type DurationSeconds, type Quality } from "@/lib/pricing"

type Pack = { id: string; name: string }

type Job = {
  id: string
  status: string
  failureMessage?: string | null
  video?: { url: string } | null
}

async function safeJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { error: text }
  }
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function GeneratePanel(props: { projectId: string }) {
  const [packs, setPacks] = useState<Pack[]>([])
  const [packId, setPackId] = useState("ugc_hook")
  const [productName, setProductName] = useState("")
  const [duration, setDuration] = useState<DurationSeconds>(5)
  const [quality, setQuality] = useState<Quality>("540p")
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const quote = useMemo(() => quoteCredits(duration, quality), [duration, quality])

  useEffect(() => {
    fetch("/api/template-packs")
      .then((r) => r.json())
      .then((d: unknown) => setPacks((d as { items?: Pack[] }).items ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!jobId) return
    const t = setInterval(() => {
      fetch(`/api/jobs/${jobId}`)
        .then((r) => r.json())
        .then((d: unknown) => setJob((d as { job?: Job }).job ?? null))
        .catch(() => {})
    }, 2000)
    return () => clearInterval(t)
  }, [jobId])

  async function submit() {
    setErr(null)
    setShareUrl(null)
    const idem = newId()
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: props.projectId,
        packId,
        duration,
        quality,
        productName,
        idempotencyKey: idem,
        language: "id",
      }),
    })
    const data = (await safeJson(res)) as { error?: string; jobId?: string }
    if (!res.ok) {
      setErr(data.error || `http_${res.status}`)
      return
    }
    setJobId(data.jobId)
  }

  async function createShareLink() {
    if (!job?.id) return
    const res = await fetch("/api/share-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    })
    const data = (await safeJson(res)) as { error?: string; token?: string }
    if (!res.ok) {
      setErr(data.error || `http_${res.status}`)
      return
    }
    if (data.token) setShareUrl(`${window.location.origin}/s/${data.token}`)
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="font-medium">Generate</div>

      <div className="flex flex-wrap gap-2">
        {packs.map((p) => (
          <button
            key={p.id}
            className={`rounded-md border px-3 py-2 text-sm ${p.id === packId ? "bg-muted" : ""}`}
            onClick={() => setPackId(p.id)}
            type="button"
          >
            {p.name}
          </button>
        ))}
      </div>

      <label className="text-sm">
        Product name
        <input
          className="mt-2 w-full rounded-md border px-3 py-2"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Duration
          <select
            className="mt-2 w-full rounded-md border px-3 py-2"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) as DurationSeconds)}
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={15}>15s</option>
          </select>
        </label>

        <label className="text-sm">
          Quality
          <select
            className="mt-2 w-full rounded-md border px-3 py-2"
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
          >
            <option value={"540p"}>Standard (540p)</option>
            <option value={"720p"}>HD (720p)</option>
            <option value={"1080p"}>Full HD (1080p)</option>
          </select>
        </label>

        <div className="text-sm">
          Quote: <span className="font-medium">{quote}</span> credits
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <button
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        onClick={submit}
        type="button"
        disabled={!productName}
      >
        Generate
      </button>

      {job ? (
        <div className="rounded-md border p-3 text-sm">
          <div>Status: {job.status}</div>
          {job.failureMessage ? <div className="mt-2 text-red-600">{job.failureMessage}</div> : null}
          {job.video?.url ? (
            <div className="mt-2 flex flex-col gap-2">
              <video controls playsInline className="w-full rounded-lg border">
                <source src={job.video.url} type="video/mp4" />
              </video>
              <a className="underline" href={`/api/jobs/${job.id}/download`}>
                Download
              </a>
              <button className="underline" onClick={createShareLink} type="button">
                Create share link
              </button>
              {shareUrl ? (
                <div className="break-all text-xs text-muted-foreground">{shareUrl}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
