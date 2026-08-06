import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GridLens NZ — Infrastructure impact atlas",
  description:
    "Explore whole-of-New-Zealand infrastructure scenarios with transparent deterministic screening and source-aware AI research.",
  openGraph: {
    title: "GridLens NZ",
    description: "Infrastructure impact atlas for Aotearoa New Zealand.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "GridLens NZ infrastructure impact atlas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GridLens NZ",
    description: "Infrastructure impact atlas for Aotearoa New Zealand.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
