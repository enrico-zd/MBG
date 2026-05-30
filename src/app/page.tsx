import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main>
      <Container>
        <div style={{ display: "grid", gap: 14 }}>
          <Card>
            <CardHeader title="MBG — AI Video Ads Generator (MVP)" right={<span style={{ fontSize: 12, opacity: 0.75 }}>9:16 • 30–45s • no-audio</span>} />
            <CardBody>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                Buat video iklan produk vertikal dengan template pack, dibagi menjadi beberapa segmen, diproses oleh PixVerse, lalu distitch menjadi MP4 final.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <Link href="/projects">
                  <Button type="button">Mulai</Button>
                </Link>
                <Link href="/ad-jobs">
                  <Button variant="secondary" type="button">
                    Buka Ad Jobs
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            <Card>
              <CardHeader title="1) Project" />
              <CardBody>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>Buat project untuk tiap brand/produk dan simpan asset gambar.</p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="2) Ad Job" />
              <CardBody>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                  Pilih template pack, isi bahasa/tone/benefit/offer/CTA, lalu submit untuk membuat job + segments.
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="3) Monitor" />
              <CardBody>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>Pantau status per segmen dan unduh output saat selesai.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
