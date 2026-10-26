import type { Metadata } from "next";
import { JetBrains_Mono, Public_Sans } from "next/font/google";

import "@/smc/styles/globals.css";
import { AppProviders } from "@/smc/components/providers/app-providers";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMC Administrative Portal | Tech-Lifter",
  description: "Administrative control center for municipal health governance.",
};

export default function SmcRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`smc-theme ${publicSans.variable} ${jetBrainsMono.variable}`}>
      <AppProviders>{children}</AppProviders>
    </div>
  );
}

