"use client";

import Link from "next/link";
import { ArrowLeft, CircleHelp, Mail, PhoneCall, ShieldAlert } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function HelpContent() {
  const { user } = useAuth();

  const faqs = [
    {
      question: "How do I update my phone number?",
      answer: "Open Account Settings, enter a unique phone number, and save. The change updates both auth_users and hospital_staff.",
    },
    {
      question: "Why do I only see hospital staff access?",
      answer: "This portal is restricted to users whose auth_users role is hospital_staff.",
    },
    {
      question: "Who should I contact for urgent access issues?",
      answer: "Use the emergency support number below for lockouts affecting active hospital operations.",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Help & Support</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Support information for {user?.hospital_name || "your hospital"} staff.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">support@smchealth.gov.in</p>
              <p className="mt-2 text-sm text-slate-500">For application access, profile corrections, and settings support.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-primary" />
                Emergency Number
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">108 / 112</p>
              <p className="mt-2 text-sm text-slate-500">Use for urgent operational issues affecting patient care or hospital access.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Logged In As
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{user?.name || "Hospital Staff"}</p>
              <p className="mt-2 text-sm text-slate-500">{user?.role || "Staff"} at {user?.hospital_name || "N/A"}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleHelp className="h-5 w-5 text-primary" />
              Basic FAQ
            </CardTitle>
            <CardDescription>Common guidance for the authenticated hospital staff portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-medium text-slate-900 dark:text-white">{faq.question}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <HelpContent />
    </ProtectedRoute>
  );
}
