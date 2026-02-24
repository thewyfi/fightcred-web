export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "FightCred — UFC Prediction Platform",
  description: "Predict UFC fight outcomes, earn credibility scores, and compete on the leaderboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0] antialiased">
        <Providers>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
