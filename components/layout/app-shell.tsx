"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home, Compass, MessageCircle, CalendarDays, Wallet, Bell, User, Settings,
  ShieldCheck, LogOut, LayoutDashboard, ChevronDown, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Badge } from "../ui";
import { CreditPill } from "../shared";
import { ThemeToggle } from "../theme";
import { GlobalSearch } from "./global-search";
import type { ClientUser } from "@/hooks/useUser";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  mobile?: boolean;
  exact?: boolean;
  badge?: number;
}

export function AppShell({ user, children }: { user: ClientUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, exact: true },
    { href: "/discover", label: "Discover", icon: <Compass size={18} />, badge: 0 },
    { href: "/messages", label: "Messages", icon: <MessageCircle size={18} />, badge: user.unreadMessages },
    { href: "/sessions", label: "Sessions", icon: <CalendarDays size={18} /> },
    { href: "/wallet", label: "Wallet", icon: <Wallet size={18} /> },
    { href: "/notifications", label: "Notifications", icon: <Bell size={18} />, badge: user.unreadNotifications },
    { href: `/users/${user.username}`, label: "Profile", icon: <User size={18} /> },
  ];
  if (user.role === "ADMIN" || user.role === "MODERATOR") {
    items.push({ href: "/admin", label: "Admin", icon: <ShieldCheck size={18} /> });
  }

  const mobileNav: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: <Home size={20} />, mobile: true, exact: true },
    { href: "/discover", label: "Discover", icon: <Compass size={20} />, mobile: true },
    { href: "/messages", label: "Messages", icon: <MessageCircle size={20} />, mobile: true, badge: user.unreadMessages },
    { href: "/sessions", label: "Sessions", icon: <CalendarDays size={20} />, mobile: true },
    { href: `/users/${user.username}`, label: "Profile", icon: <User size={20} />, mobile: true },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------- Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card/60 backdrop-blur lg:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Main navigation">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className={cn(active && "text-primary")}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground tabular-nums">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Balance</span>
            <CreditPill count={user.credits} animate={false} />
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-secondary"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Avatar src={user.image} name={user.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{user.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">@{user.username}</span>
              </span>
              <ChevronDown size={15} className={cn("text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
            </button>
            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 z-40 mb-2 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-lift" role="menu">
                <MenuItem href={`/users/${user.username}`} onClick={() => setMenuOpen(false)} icon={<User size={15} />}>
                  My profile
                </MenuItem>
                <MenuItem href="/settings" onClick={() => setMenuOpen(false)} icon={<Settings size={15} />}>
                  Settings
                </MenuItem>
                <MenuItem href="/wallet" onClick={() => setMenuOpen(false)} icon={<Wallet size={15} />}>
                  Wallet
                </MenuItem>
                <button
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------ Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-lg lg:pl-[264px] lg:pr-6">
        <Link href="/dashboard" className="lg:hidden">
          <Logo />
        </Link>
        <div className="hidden max-w-md flex-1 md:block">
          <GlobalSearch />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/discover"
            className="hidden items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-lift sm:inline-flex"
          >
            <Sparkles size={15} /> Find a swap
          </Link>
          <CreditPill count={user.credits} className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Link
            href="/notifications"
            aria-label={`Notifications (${user.unreadNotifications} unread)`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-soft transition-colors hover:text-foreground"
          >
            <Bell size={16} />
            {user.unreadNotifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {user.unreadNotifications > 9 ? "9+" : user.unreadNotifications}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------- Content */}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</div>
      </main>

      {/* ---------------------------------------------- Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg safe-bottom lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
          {mobileNav.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative">
                  {item.icon}
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold text-primary-foreground">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </span>
                {item.label}
                {active && <span className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile search bar above bottom nav */}
      <div className="fixed inset-x-0 bottom-[68px] z-30 px-4 lg:hidden">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card/95 p-1 shadow-lift backdrop-blur">
          <GlobalSearch />
        </div>
      </div>
    </div>
  );
}

function MenuItem({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} role="menuitem" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">
      {icon}
      {children}
    </Link>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-soft">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 7h10l-3-3M17 17H7l3 3" />
        </svg>
      </span>
      <span className={cn("font-display font-extrabold tracking-tight", size === "md" ? "text-lg" : "text-base")}>
        Skill<span className="text-primary">Swap</span>
      </span>
    </span>
  );
}
