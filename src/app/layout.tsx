import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PathPulse — Website Behaviour Tracker",
  description:
    "Open-source website behaviour analytics: click heatmaps, scroll maps, rage-click detection, live event streams and session replay. A modern, self-hosted alternative to single-file trackers.",
  keywords: [
    "behaviour tracker",
    "session replay",
    "click heatmap",
    "scroll depth",
    "analytics",
    "rage clicks",
    "Next.js",
  ],
  authors: [{ name: "PathPulse" }],
  openGraph: {
    title: "PathPulse — Website Behaviour Tracker",
    description:
      "Click heatmaps, scroll maps, rage-click detection, live event streams and session replay.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
