import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "SAMVED Smart Health Management System | Integrated Healthcare Ecosystem",
  description: "Unified Smart City Health Management System connecting Municipal Governance (SMC), Hospital Operations, Pharmacy Supply Chain, and Diagnostic Laboratories.",
  keywords: ["Smart Health Management System", "Healthcare Ecosystem", "SAMVED", "Hospital Management", "SMC Governance", "Pharma Portal", "Diagnostic Labs"],
  authors: [{ name: "Tech-Lifter" }],
  icons: {
    icon: "/health-logo.png",
  },
  openGraph: {
    title: "SAMVED Smart Health Management System",
    description: "Unified Smart City Health System by Tech-Lifter",
    url: "https://tech-lifter.health",
    siteName: "SAMVED Smart Health Management System",
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
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
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
