import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentMadness — AI Tournament Simulator",
  description: "AI-powered NCAA Tournament bracket simulator. 136 teams. 134 games. Every matchup simulated by Claude AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0A0E17] text-[#F8FAFC] min-h-screen`}
      >
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
