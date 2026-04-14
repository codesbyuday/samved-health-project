"use client";

export const dynamic = "force-dynamic";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Hospital, Lock, Shield, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, setAuthState } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(searchParams.get("next") || "/dashboard");
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setError("Please enter both identifier and password.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: trimmedIdentifier,
          password: trimmedPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Invalid credentials");
        return;
      }

      setAuthState(result.user);
      router.replace(searchParams.get("next") || "/dashboard");
    } catch {
      setError("Unable to log in right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-4 py-10 dark:from-stone-950 dark:via-emerald-950/30 dark:to-stone-950">
      <Card className="w-full max-w-md border-slate-200 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-400 text-white shadow-lg shadow-emerald-900/20">
            <Hospital className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Hospital Staff Login</CardTitle>
            <CardDescription>
              Sign in with your registered email or phone to access the Tech-Lifter Hospital Management Portal.
            </CardDescription>
          </div>
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            <Shield className="h-3.5 w-3.5" />
            <span>Restricted to hospital staff only</span>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Phone</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Enter email or phone"
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <span>Back to </span>
            <Link href="/" className="font-medium text-primary hover:underline">
              landing page
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
