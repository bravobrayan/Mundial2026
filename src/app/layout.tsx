import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// minimumScale evita que iOS Safari deje la página "atascada" en zoom
// alejado (se vería cortada); el zoom para ACERCAR sigue permitido.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiniela Mundial 2026",
  description:
    "Predice los 104 partidos de la Copa Mundial de la FIFA 2026 y compite por el primer lugar.",
  icons: {
    icon: "/brand/wc2026-white.svg",
    apple: "/brand/wc2026-white.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-stadium min-h-full flex flex-col">{children}</body>
    </html>
  );
}
