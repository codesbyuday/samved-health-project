"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/smc/lib/supabase/browser";

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
          const supabase = createClient();
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setError(signInError.message);
            return;
          }

          router.replace("/smc/dashboard");
          router.refresh();
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
          Sign in with your assigned Supabase-authenticated official account.
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
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in to SAMVED"}
      </button>
    </form>
  );
}

