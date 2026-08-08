"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Sparkles, HeartHandshake, MessageCircle, CalendarDays, Star, Coins, ShieldAlert, Info, CalendarCheck2 } from "lucide-react";
import { get, post } from "@/lib/client";
import { Button, Skeleton, EmptyState, Badge } from "@/components/ui";
import { relativeTime } from "@/lib/utils";
import { toastSuccess } from "@/components/toasts";
import type { Notification } from "@/types";


const ICONS: Record<string, React.ReactNode> = {
  MATCH: <HeartHandshake size={16} />,
  SWAP_REQUEST: <Sparkles size={16} />,
  REQUEST_ACCEPTED: <CheckCheck size={16} />,
  MESSAGE: <MessageCircle size={16} />,
  SESSION_REMINDER: <CalendarDays size={16} />,
  SESSION_COMPLETED: <CalendarCheck2 size={16} />,
  REVIEW: <Star size={16} />,
  CREDIT: <Coins size={16} />,
  SYSTEM: <ShieldAlert size={16} />,
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[] | null>(null);

  React.useEffect(() => {
    get<{ notifications: Notification[] }>("/api/notifications?limit=50")
      .then((res) => setNotifications(res.notifications))
      .catch(() => setNotifications([]));
  }, []);

  const markAll = async () => {
    await post("/api/notifications/read", { all: true });
    setNotifications((prev) => prev?.map((n) => ({ ...n, read: true })) ?? []);
    toastSuccess("All caught up ✓");
    router.refresh();
  };

  const markOne = async (id: string) => {
    await post("/api/notifications/read", { notificationId: id });
    setNotifications((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? []);
    router.refresh();
  };

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "You're all caught up."}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {notifications === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-6 w-6" />} title="Nothing here yet" description="Swap requests, messages, session reminders and credit updates will appear here." action={<Button size="sm" href="/discover">Find a match</Button>} />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} onOpen={() => void markOne(n.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onOpen }: { n: Notification; onOpen: () => void }) {
  const inner = (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 transition-all ${n.read ? "border-border bg-card" : "border-primary/25 bg-primary/[0.04] shadow-soft"}`}>
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.read ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"}`}>
        {ICONS[n.type] ?? <Info size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold">{n.title}</p>
          <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{n.message}</p>
      </div>
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
    </div>
  );

  if (n.link) {
    return (
      <Link href={n.link} onClick={onOpen} className="block">
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}
