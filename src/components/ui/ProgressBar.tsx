export function ProgressBar({ value }: { value: number }) {
  const v = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div
      style={{
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div style={{ height: "100%", width: `${v}%`, background: "linear-gradient(90deg, var(--brand), var(--brand2))" }} />
    </div>
  );
}
