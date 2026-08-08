"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { MailCheck, RefreshCw, ShieldCheck, PartyPopper, Loader2 } from "lucide-react";
import { post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import { Button } from "@/components/ui";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialEmail = params.get("email") ?? "";

  const [step, setStep] = React.useState<"email" | "code" | "done">(initialEmail ? "code" : "email");
  const [email, setEmail] = React.useState(initialEmail);
  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const [error, setError] = React.useState<string | undefined>();
  const [alreadyVerified, setAlreadyVerified] = React.useState(false);

  const requestCode = async (targetEmail: string) => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await post<{ message: string; resendAfterSec: number }>("/api/auth/resend-otp", { email: targetEmail });
      setEmail(targetEmail);
      setStep("code");
      setCooldown(Math.max(res.resendAfterSec, 60));
      setDigits(["", "", "", "", "", ""]);
      toastSuccess("Code sent", "Check your inbox — it expires in 10 minutes.");
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code.");
    } finally {
      setBusy(false);
    }
  };

  // Countdown for the resend button
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Auto-focus first box on code step
  React.useEffect(() => {
    if (step === "code") setTimeout(() => inputsRef.current[0]?.focus(), 80);
  }, [step]);

  const setDigit = (idx: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    setError(undefined);
    if (clean && idx < 5) inputsRef.current[idx + 1]?.focus();
    // Auto-submit when all six are filled
    if (next.every((d) => d !== "")) {
      void submitCode(next.join(""));
    }
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    if (text.length === 6) void submitCode(text);
    else inputsRef.current[text.length]?.focus();
  };

  const submitCode = async (code?: string) => {
    const value = code ?? digits.join("");
    if (value.length !== 6) return setError("Enter the 6-digit code.");
    setBusy(true);
    setError(undefined);
    try {
      const res = await post<{ message: string; emailVerified: boolean }>("/api/auth/verify-otp", { email, code: value });
      setAlreadyVerified(res.emailVerified);
      setStep("done");
      toastSuccess("Email verified 🎉", "You can now sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code isn't valid.");
      setDigits(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  if (step === "done") {
    return (
      <div className="animate-scale-in rounded-3xl border border-border bg-card p-9 text-center shadow-lift">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"
        >
          <PartyPopper size={28} />
        </motion.span>
        <h1 className="font-display mt-5 text-2xl font-extrabold tracking-tight">You're verified! 🎉</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {alreadyVerified ? "Your email is confirmed." : "Your email is confirmed."} Sign in to start swapping skills.
        </p>
        <div className="mt-7 flex justify-center">
          <Button size="lg" onClick={() => router.push("/login")}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (step === "email") {
    return (
      <div className="animate-fade-in rounded-3xl border border-border bg-card p-8 text-center shadow-lift sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck size={26} />
        </span>
        <h1 className="font-display mt-4 text-2xl font-extrabold tracking-tight">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email you signed up with and we'll send you a 6-digit code.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email.");
            void requestCode(email.trim());
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-center text-sm shadow-soft focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Send code
          </Button>
        </form>
        <p className="mt-5 text-xs text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-3xl border border-border bg-card p-8 text-center shadow-lift sm:p-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ShieldCheck size={26} />
      </span>
      <h1 className="font-display mt-4 text-2xl font-extrabold tracking-tight">Check your inbox</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-bold text-foreground">{email}</span>. It expires in 10 minutes.
        {process.env.NODE_ENV === "development" && (
          <span className="mt-1 block text-xs text-muted-foreground/70">(In this demo, the email is logged to the server console.)</span>
        )}
      </p>

      <div className="mt-7 flex justify-center gap-2 sm:gap-2.5" onPaste={onPaste} role="group" aria-label="6-digit verification code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            className={`h-12 w-10 rounded-xl border bg-background text-center font-display text-lg font-extrabold tabular-nums shadow-soft transition-all focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-14 sm:w-12 ${
              d ? "border-primary/50 text-foreground" : "border-input"
            }`}
          />
        ))}
      </div>

      {busy && <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Loader2 size={12} className="animate-spin" /> Verifying…</p>}
      {error && <p className="mt-4 text-xs font-medium text-destructive" role="alert">{error}</p>}

      <div className="mt-7 flex flex-col items-center gap-3">
        <Button size="lg" className="w-full sm:w-auto" onClick={() => void submitCode()} loading={busy}>
          Verify email
        </Button>
        <button
          onClick={() => void requestCode(email)}
          disabled={cooldown > 0 || resending}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        >
          <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>

      <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        Wrong email?{" "}
        <button onClick={() => setStep("email")} className="font-bold text-primary hover:underline">Change it</button>{" "}
        · Already verified?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">Sign in</Link>
      </div>
    </div>
  );
}
