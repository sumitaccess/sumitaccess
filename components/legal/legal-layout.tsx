import Link from "next/link";
import { Logo } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/theme";

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="SkillSwap home"><Logo size="sm" /></Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Home</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">SkillSwap · Policy</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">Last updated: {updated}</p>
        <div className="prose-sm mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/85 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-pretty [&_li]:mb-1.5">
          {children}
        </div>
      </main>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SkillSwap · Your skills are worth something.
      </footer>
    </div>
  );
}
