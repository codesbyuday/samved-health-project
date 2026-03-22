import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "SMC Hospital Portal - Solapur Municipal Corporation",
  description: "Smart Public Health Management System for Solapur Municipal Corporation. Manage patients, appointments, infrastructure, disease reporting, and hospital analytics.",
  keywords: ["Hospital Management", "Healthcare", "Solapur", "Government Hospital", "Public Health", "SMC", "Medical Portal"],
  authors: [{ name: "Solapur Municipal Corporation" }],
  icons: {
    icon: "/favicon_smc.png",
  },
  openGraph: {
    title: "SMC Hospital Portal",
    description: "Smart Public Health Management System",
    url: "https://smc.solapur.gov.in",
    siteName: "SMC Hospital Portal",
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
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
