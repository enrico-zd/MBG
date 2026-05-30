import type { ReactNode } from "react";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.18)", border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
      <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6 }}>{label}</div>
      {children}
      {hint ? <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{hint}</div> : null}
    </div>
  );
}
