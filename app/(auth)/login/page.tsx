import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <div className="animate-fade-in rounded-3xl border border-border bg-card p-7 shadow-lift sm:p-9">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Welcome back 👋</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue swapping skills.</p>
      <div className="mt-6">
        <Suspense>
          <LoginForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to SkillSwap?{" "}
        <Link href="/register" className="font-bold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
