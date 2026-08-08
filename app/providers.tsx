"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/toasts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
