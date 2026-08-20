"use client";

import React, { createContext, useContext, useState, useTransition, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import SMCPortalLoading from "@/app/smc/(portal)/loading";

interface SMCNavigationContextType {
  pendingPath: string | null;
  isNavigating: boolean;
  navigateTo: (targetPath: string) => void;
}

const SMCNavigationContext = createContext<SMCNavigationContextType>({
  pendingPath: null,
  isNavigating: false,
  navigateTo: () => {},
});

export function SMCNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [targetPath, setTargetPath] = useState<string | null>(null);

  const navigateTo = useCallback(
    (href: string) => {
      if (href === pathname) return;
      setTargetPath(href);
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router]
  );

  const isNavigating = isPending && targetPath !== null && targetPath !== pathname;
  const activePending = isNavigating ? targetPath : null;

  return (
    <SMCNavigationContext.Provider
      value={{
        pendingPath: activePending,
        isNavigating,
        navigateTo,
      }}
    >
      {children}
    </SMCNavigationContext.Provider>
  );
}

export function useSMCNavigation() {
  return useContext(SMCNavigationContext);
}

export function SMCContentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isNavigating } = useSMCNavigation();

  return (
    <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
      {isNavigating ? <SMCPortalLoading /> : children}
    </main>
  );
}
