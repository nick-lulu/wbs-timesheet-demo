import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:8081"),
  title: "Corporate Solution Timesheet",
  description: "High-fidelity operating model for CSCOP planning, delivery, timesheets and audit governance.",
  icons: {
    icon: "/lululemon-logo.png",
    shortcut: "/lululemon-logo.png",
  },
  openGraph: {
    title: "Corporate Solution Timesheet",
    description: "One project record. A complete delivery loop.",
    images: [{ url: "/og.png", width: 1672, height: 941 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corporate Solution Timesheet",
    description: "One project record. A complete delivery loop.",
    images: ["/og.png"],
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
