import type { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 28px" }}>{children}</div>;
}
