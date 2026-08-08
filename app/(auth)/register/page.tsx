import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <div className="animate-fade-in rounded-3xl border border-border bg-card p-7 shadow-lift sm:p-9">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Join SkillSwap</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Your skills are worth something. Let's prove it.</p>
      <div className="mt-6">
        <RegisterForm googleEnabled={googleEnabled} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already a member?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
