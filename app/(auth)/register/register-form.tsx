"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { toastError, toastSuccess } from "@/components/toasts";
import { post } from "@/lib/client";

const schema = z
  .object({
    name: z.string().min(2, "Tell us your name.").max(60),
    email: z.string().email("Enter a valid email."),
    password: z.string().min(8, "Use at least 8 characters.").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

type FormValues = z.infer<typeof schema>;

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await post("/api/register", { name: values.name, email: values.email, password: values.password });
      toastSuccess("Account created 🎉", "You're one step from your first swap.");
      const res = await signIn("credentials", { redirect: false, email: values.email, password: values.password });
      if (res?.error) {
        router.push("/login");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      toastError("Couldn't create your account", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" placeholder="Aarav Sharma" {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" {...register("password")} />
        </Field>
        <Field label="Confirm" htmlFor="confirm" error={errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" placeholder="Repeat it" {...register("confirm")} />
        </Field>
      </div>
      <Button type="submit" loading={loading} size="lg" className="w-full">
        <Sparkles size={17} /> Create my account
      </Button>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        By joining you agree to our <a href="/terms" className="underline hover:text-foreground">Terms</a> and{" "}
        <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>. You'll receive{" "}
        <span className="font-semibold text-primary">3 starter Skill Credits</span> 🎁
      </p>
      {googleEnabled && (
        <>
          <div className="relative py-1 text-center">
            <span className="relative z-10 bg-background px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">or</span>
            <span className="absolute left-0 top-1/2 h-px w-full bg-border" aria-hidden />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/onboarding" })}>
            Continue with Google
          </Button>
        </>
      )}
    </form>
  );
}
