"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { toastError, toastSuccess } from "@/components/toasts";
import { post } from "@/lib/client";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters.").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [loading, setLoading] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="rounded-3xl border border-border bg-card p-9 text-center shadow-lift">
        <h1 className="font-display text-xl font-extrabold">Missing reset link</h1>
        <p className="mt-2 text-sm text-muted-foreground">This link is invalid. Request a new one.</p>
        <Link href="/forgot-password" className="mt-5 inline-block text-sm font-bold text-primary hover:underline">
          Request a reset link
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await post("/api/reset-password", { token, password: values.password });
      toastSuccess("Password updated", "Sign in with your new password.");
      router.push("/login");
    } catch (err) {
      toastError("Couldn't reset your password", err instanceof Error ? err.message : "Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in rounded-3xl border border-border bg-card p-7 shadow-lift sm:p-9">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <KeyRound size={22} />
      </span>
      <h1 className="font-display mt-4 text-2xl font-extrabold tracking-tight">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Make it strong — it protects your Skill Credits.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <Field label="New password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" {...register("password")} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" placeholder="Repeat it" {...register("confirm")} />
        </Field>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Update password
        </Button>
      </form>
    </div>
  );
}
