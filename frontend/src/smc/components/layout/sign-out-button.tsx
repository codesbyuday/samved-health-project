"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/smc/lib/supabase/browser";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          if (typeof window !== "undefined") {
            document.cookie = "samved_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            localStorage.removeItem("USER_SESSION_KEY");
            localStorage.removeItem("USER_PROFILE_KEY");
          }
          const supabase = createClient();
          await supabase.auth.signOut();
        } catch (e) {
          // Ignore error
        } finally {
          if (typeof window !== "undefined") {
            window.location.href = "/smc/login";
          }
        }
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

