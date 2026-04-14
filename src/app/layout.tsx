import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Hospital Management Portal | Tech-Lifter",
  description: "Premium hospital operations portal for patient records, appointments, infrastructure, referrals, medicines, disease analytics, and role-based clinical workflows.",
  keywords: ["Hospital Management", "Healthcare", "Tech-Lifter", "Patient Records", "Medical Portal", "Hospital Operations"],
  authors: [{ name: "Tech-Lifter" }],
  icons: {
    icon: "/health-logo.png",
  },
  openGraph: {
    title: "Hospital Management Portal",
    description: "Hospital operations and patient records portal by Tech-Lifter",
    url: "https://tech-lifter.health",
    siteName: "Hospital Management Portal",
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
