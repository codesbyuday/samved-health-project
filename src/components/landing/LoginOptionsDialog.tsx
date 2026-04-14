"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LoginOptionsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleHospitalLogin = () => {
    setOpen(false);
    router.push("/login");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-w-28">Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hospital Portal Access</DialogTitle>
          <DialogDescription>
            Continue to the secure hospital staff login.
          </DialogDescription>
        </DialogHeader>
        <Card className="border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-amber-50/60 dark:border-emerald-900/60 dark:from-stone-950 dark:via-emerald-950/30 dark:to-amber-950/20">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-400 text-white shadow-lg shadow-emerald-900/20">
                <Stethoscope className="h-5 w-5" />
              </div>
              <Badge>Active</Badge>
            </div>
            <CardTitle className="text-lg">Hospital Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Access patient records, appointments, lab reports, referrals, inventory, and hospital dashboards.
            </p>
            <Button className="w-full" onClick={handleHospitalLogin}>
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
