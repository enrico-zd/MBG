import Link from "next/link";

export function Nav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid var(--border)",
        background: "rgba(14,18,26,0.9)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, letterSpacing: 0.2 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "var(--brand)",
              boxShadow: "0 0 0 6px rgba(124,92,255,0.18)",
            }}
          />
          <Link href="/">MBG</Link>
        </div>
        <nav style={{ display: "flex", gap: 14, fontSize: 13, opacity: 0.9 }}>
          <Link href="/">Home</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/ad-jobs">Ad Jobs</Link>
        </nav>
      </div>
    </header>
  );
}
