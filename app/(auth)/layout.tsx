import Link from "next/link";
import { Logo } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/theme";

export const metadata = { title: "Welcome" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-100px] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
      <header className="relative z-10 flex items-center justify-between px-5 py-4">
        <Link href="/" aria-label="SkillSwap home"><Logo /></Link>
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">← Back to SkillSwap</Link>
      </footer>
    </div>
  );
}
