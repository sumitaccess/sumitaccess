"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { cn, initials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[.98] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-lift",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        outline: "border border-border bg-background hover:bg-secondary/60 hover:border-foreground/20",
        ghost: "hover:bg-secondary/70 text-foreground/80 hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
        iconSm: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  href?: string;
  target?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, href, target, children, disabled, ...props }, ref) => {
    const content = (
      <>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </>
    );
    if (href) {
      return (
        <Link href={href} target={target} className={cn(buttonVariants({ variant, size }), className)}>
          {content}
        </Link>
      );
    }
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
        {content}
      </button>
    );
  },
);
Button.displayName = "Button";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm shadow-soft transition-colors",
        "placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[84px] w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-soft transition-colors",
        "placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("mb-1.5 block text-[13px] font-semibold text-foreground/90", className)} {...props} />
  ),
);
Label.displayName = "Label";

export function Field({ label, hint, error, children, htmlFor }: { label?: string; hint?: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-0.5">
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// Native select, styled
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background px-3.5 py-2 text-sm shadow-soft transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

// ---------------------------------------------------------------------------
// Card / Badge / Avatar / Skeleton
// ---------------------------------------------------------------------------

export function Card({ className, children, hover, ...props }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-soft",
        hover && "transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5 hover:border-foreground/15",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground/70",
        success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        destructive: "bg-red-500/10 text-red-600 dark:text-red-400",
        accent: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function Avatar({ src, name, size = "md", className, ring }: { src?: string | null; name: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string; ring?: boolean }) {
  const sizes = { xs: "h-7 w-7 text-[10px]", sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-base", xl: "h-20 w-20 text-xl" };
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/15 to-accent text-primary", sizes[size], ring && "ring-2 ring-background", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold" aria-hidden>
          {initials(name)}
        </span>
      )}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-muted-foreground", className)} aria-label="Loading" />;
}

// ---------------------------------------------------------------------------
// Modal (accessible dialog)
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", full: "max-w-3xl" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={cn("relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-lift sm:rounded-2xl", widths[size])}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>}
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4.5 w-4.5" size={18} />
              </button>
            </div>
            {children && <div className="mt-4">{children}</div>}
            {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export function Tabs({ tabs, value, onChange, className }: { tabs: { key: string; label: React.ReactNode; count?: number }[]; value: string; onChange: (key: string) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("flex items-center gap-1 overflow-x-auto no-scrollbar", className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {t.label}
          {typeof t.count === "number" && t.count > 0 && (
            <span className={cn("rounded-full px-1.5 text-[10px] font-bold", value === t.key ? "bg-background/20 text-background" : "bg-primary/10 text-primary")}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

export function Stars({ rating, size = 14, className, interactive, onChange, ariaLabel }: { rating: number; size?: number; className?: string; interactive?: boolean; onChange?: (v: number) => void; ariaLabel?: string }) {
  const [hover, setHover] = React.useState(0);
  const value = hover || rating;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role={interactive ? "radiogroup" : "img"} aria-label={ariaLabel ?? `${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          className={cn("transition-transform", interactive && "cursor-pointer hover:scale-125")}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={i <= value ? "#f59e0b" : "none"} stroke={i <= value ? "#f59e0b" : "currentColor"} strokeWidth={1.8} strokeLinejoin="round" className="opacity-90">
            <path d="M11.5 2.5l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3-5.6-3.3-5.6 3.3 1.4-6.3L2.5 9l6.4-.6z" />
          </svg>
        </button>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({ icon, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center", className)}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">{icon}</div>
      )}
      <h3 className="font-display text-base font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full bg-sky-500 p-0.5 text-white", className)} aria-label="Verified member" title="Verified member">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}
