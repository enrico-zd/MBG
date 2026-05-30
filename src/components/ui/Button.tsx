import type { ButtonHTMLAttributes, CSSProperties } from "react";

type Variant = "primary" | "secondary";

export function Button({
  variant = "primary",
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    padding: "0 14px",
    borderRadius: 12,
    fontWeight: 800,
    border: 0,
    cursor: "pointer",
    gap: 8,
  };

  const v: Record<Variant, CSSProperties> = {
    primary: { background: "var(--brand)", color: "var(--bg)" },
    secondary: { background: "rgba(255,255,255,0.06)", color: "var(--text)", border: "1px solid rgba(255,255,255,0.12)" },
  };

  return <button {...props} style={{ ...base, ...v[variant], ...style }} />;
}
