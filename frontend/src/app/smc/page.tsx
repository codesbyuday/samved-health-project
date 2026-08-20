import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/smc/lib/auth/session";

export default async function HomePage() {
  const context = await getCurrentUserContext();
  redirect(context ? "/smc/dashboard" : "/smc/login");
}


