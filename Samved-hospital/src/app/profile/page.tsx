"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, BriefcaseMedical, Building2, Phone, UserRound } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function ProfileContent() {
  const { user } = useAuth();

  const sections = [
    {
      title: "Basic Info",
      icon: UserRound,
      items: [
        ["Name", user?.name],
        ["Role", user?.role],
        ["Staff ID", user?.staff_id],
      ],
    },
    {
      title: "Hospital Info",
      icon: Building2,
      items: [
        ["Hospital Name", user?.hospital_name],
        ["Hospital ID", user?.hospital_id],
      ],
    },
    {
      title: "Professional Info",
      icon: BriefcaseMedical,
      items: [
        ["Designation", user?.designation],
        ["Department", user?.department],
        ["Joined Date", user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : null],
      ],
    },
    {
      title: "Contact Info",
      icon: Phone,
      items: [
        ["Email", user?.email],
        ["Phone", user?.phone],
        ["Address", user?.address],
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Personal and hospital information fetched from Supabase.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              {user?.name || "Hospital Staff"}
            </CardTitle>
            <CardDescription>{user?.hospital_name || "Hospital not assigned"}</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.items.map(([label, value]) => (
                    <div key={label} className="rounded-lg border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{value || "N/A"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
