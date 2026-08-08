"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { toastError, toastSuccess } from "@/components/toasts";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email: values.email, password: values.password });
    setLoading(false);
    if (res?.error) {
      toastError("Couldn't sign you in", "Check your email and password, or try resetting your password.");
      return;
    }
    toastSuccess("Welcome back! 👋");
    router.push(params.get("callbackUrl") || "/dashboard");
    router.refresh();
  };

  const demoLogin = async () => {
    setDemoLoading(true);
    const res = await signIn("credentials", { redirect: false, email: "demo@skillswap.app", password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || "demo1234" });
    setDemoLoading(false);
    if (res?.error) {
      toastError("Demo login failed", "Run `npm run db:setup` to seed the demo account.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <a href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
            Forgot password?
          </a>
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          <LogIn size={17} /> Sign in
        </Button>
      </form>

      <div className="relative py-1 text-center">
        <span className="relative z-10 bg-background px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">or</span>
        <span className="absolute left-0 top-1/2 h-px w-full bg-border" aria-hidden />
      </div>

      <div className="space-y-3">
        {googleEnabled && (
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
        )}
        <Button type="button" variant="secondary" size="lg" className="w-full" loading={demoLoading} onClick={demoLogin}>
          ✨ Try the demo account
        </Button>
      </div>
    </div>
  );
}
