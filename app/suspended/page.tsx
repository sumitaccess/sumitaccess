import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/layout/app-shell";

export const metadata = { title: "Account suspended" };

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Logo />
      <div className="mt-8 w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <ShieldAlert size={26} />
        </span>
        <h1 className="font-display mt-4 text-xl font-extrabold">Your account is suspended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is usually temporary. If you believe this is a mistake, contact support and we'll look into it right away.
        </p>
        <a href="mailto:support@skillswap.app" className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          Contact support
        </a>
        <div className="mt-4">
          <Link href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground">← Back to SkillSwap</Link>
        </div>
      </div>
    </div>
  );
}
