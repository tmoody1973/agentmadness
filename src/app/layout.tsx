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
  metadataBase: new URL("https://agentmadness.vercel.app"),
  openGraph: {
    title: "AgentMadness — AI Tournament Simulator",
    description: "68 teams become AI agents. Claude simulates every game. ElevenLabs calls every upset. The bracket fills in real time.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AgentMadness — AI-Powered Tournament Simulator",
      },
    ],
    type: "website",
    siteName: "AgentMadness",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentMadness — AI Tournament Simulator",
    description: "68 teams become AI agents. Claude simulates every game. ElevenLabs calls every upset. The bracket fills in real time.",
    images: ["/images/og-image.jpg"],
    creator: "@tarikmoody",
  },
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
