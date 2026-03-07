import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { PaddleProvider } from "@/components/paddle";
import { PostHogProvider } from "@/components/posthog";

// Primary serif font for headings - scholarly, warm
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

// Primary sans-serif font for body/UI - clean, readable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Keep Geist Mono for code blocks
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "ledgr — Your Daily Spending Companion",
  description:
    "Know exactly what you can spend today, every day. Calendar-first budgeting built for freedom, not restriction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lora.variable} ${inter.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          <PaddleProvider>{children}</PaddleProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
