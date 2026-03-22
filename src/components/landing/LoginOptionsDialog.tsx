"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Shield, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const options = [
  {
    key: "hospital-staff",
    title: "Login as Hospital Staff",
    description: "Access the internal hospital operations dashboard.",
    icon: Stethoscope,
    active: true,
  },
  {
    key: "smc-official",
    title: "Login as SMC Official",
    description: "City-wide monitoring and administrative oversight.",
    icon: Shield,
    active: false,
  },
  {
    key: "provider",
    title: "Login as Provider",
    description: "Partner and external provider access module.",
    icon: Building2,
    active: false,
  },
];

export function LoginOptionsDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSelect = (active: boolean) => {
    if (active) {
      setOpen(false);
      router.push("/login");
      return;
    }

    toast({
      title: "Coming Soon",
      description: "This module will be available soon",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-w-28">Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Access Type</DialogTitle>
          <DialogDescription>
            Select how you want to enter the Smart Public Health System.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <Card
                key={option.key}
                className="border-slate-200 transition-shadow hover:shadow-lg dark:border-slate-800"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    {option.active ? <Badge>Active</Badge> : <Badge variant="outline">Coming Soon</Badge>}
                  </div>
                  <CardTitle className="text-base">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{option.description}</p>
                  <Button
                    variant={option.active ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handleSelect(option.active)}
                  >
                    {option.active ? "Continue" : "Notify Me Later"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
