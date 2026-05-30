import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdStudio MVP",
  description: "Product Ads Video Campaign Studio MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-neutral-950 text-neutral-100">{children}</body>
    </html>
  );
}
