"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { post } from "@/lib/client";

const schema = z.object({ email: z.string().email("Enter a valid email.") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async () => {
    setLoading(true);
    setError(undefined);
    try {
      await post("/api/forgot-password", { email: getValues("email") });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="animate-scale-in rounded-3xl border border-border bg-card p-9 text-center shadow-lift">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <MailCheck size={26} />
        </span>
        <h1 className="font-display mt-4 text-xl font-extrabold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <span className="font-semibold text-foreground">{getValues("email")}</span>, you'll receive a
          password reset link within a minute. (In this demo, the email is logged to the server console.)
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-bold text-primary hover:underline">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-3xl border border-border bg-card p-7 shadow-lift sm:p-9">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Enter the email you signed up with and we'll send you a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message || error}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
