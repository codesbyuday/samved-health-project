"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/smc/lib/supabase/browser";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace("/smc/login");
        router.refresh();
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

