import type { CSSProperties, ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "queued" | "running" | "done" }) {
  const map: Record<string, CSSProperties> = {
    neutral: { borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" },
    queued: { borderColor: "rgba(124,92,255,0.35)", background: "rgba(124,92,255,0.14)" },
    running: { borderColor: "rgba(95,199,255,0.35)", background: "rgba(95,199,255,0.14)" },
    done: { borderColor: "rgba(98,255,161,0.35)", background: "rgba(98,255,161,0.12)" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: 12,
        ...map[tone]!,
      }}
    >
      {children}
    </span>
  );
}
