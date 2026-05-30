import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <section style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      {children}
    </section>
  );
}

export function CardHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: 12,
        borderBottom: "1px solid var(--border)",
        background: "var(--panel2)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 14, letterSpacing: 0.2 }}>{title}</h2>
      {right}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div style={{ padding: 12 }}>{children}</div>;
}
