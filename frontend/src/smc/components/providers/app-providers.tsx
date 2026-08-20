import { QueryProvider } from "@/smc/components/providers/query-provider";
import { ThemeProvider } from "@/smc/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}

