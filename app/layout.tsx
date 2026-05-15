import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glory Umuerri — Backend Engineer",
  description:
    "Backend engineer specialising in Node.js, TypeScript, REST APIs, and real-time systems. Building the infrastructure other developers ship on.",
  keywords: [
    "backend engineer",
    "Node.js",
    "TypeScript",
    "REST API",
    "WebSockets",
    "Nigeria",
  ],
  authors: [{ name: "Glory Umuerri" }],
  openGraph: {
    title: "Glory Umuerri — Backend Engineer",
    description:
      "REST APIs, real-time systems, and clean architecture in the Node.js/TypeScript ecosystem.",
    url: "https://gloryumuerri.dev",
    siteName: "Glory Umuerri",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Glory Umuerri — Backend Engineer",
    description:
      "REST APIs, real-time systems, and clean architecture in the Node.js/TypeScript ecosystem.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black">{children}</body>
    </html>
  );
}
