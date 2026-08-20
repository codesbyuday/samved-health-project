"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/services/apiClient";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="surface w-full max-w-md space-y-5 p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");

        try {
          const res = await apiClient.post<any>('/auth/login', {
            identifier: email,
            email,
            password,
            portal: 'smc'
          });

          if (res.error || !res.data?.success) {
            setError(res.error || res.data?.error || "Authentication failed. Please check credentials.");
            return;
          }

          if (typeof window !== 'undefined') {
            if (res.data.token) {
              localStorage.setItem('USER_SESSION_KEY', res.data.token);
              document.cookie = `samved_session=${res.data.token}; path=/; max-age=86400`;
            }
            if (res.data.user) {
              localStorage.setItem('USER_PROFILE_KEY', JSON.stringify(res.data.user));
            }
          }

          router.replace("/smc/dashboard");
          router.refresh();
        } catch (err: any) {
          setError(err?.message || "An unexpected error occurred during sign-in.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Official Login
        </div>
        <h1 className="mt-3 text-2xl font-semibold">
          SMC Administrative Web Portal
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in with your assigned official account.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5"
          placeholder="official@smc.gov.in"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5"
          placeholder="Enter password"
        />
      </label>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in to SAMVED...
          </>
        ) : (
          "Sign in to SAMVED"
        )}
      </button>
    </form>
  );
}

