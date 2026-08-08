"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, CalendarPlus, Compass } from "lucide-react";
import { get } from "@/lib/client";
import { useUser } from "@/hooks/useUser";
import { SessionCard } from "@/components/sessions/session-card";
import { Tabs, Button, Skeleton, EmptyState } from "@/components/ui";
import type { SessionDetail } from "@/lib/sessions";


const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function SessionsPage() {
  const user = useUser();
  const [tab, setTab] = React.useState("upcoming");
  const [sessions, setSessions] = React.useState<SessionDetail[] | null>(null);

  React.useEffect(() => {
    setSessions(null);
    get<{ sessions: SessionDetail[] }>(`/api/sessions?tab=${tab}`)
      .then((res) => setSessions(res.sessions))
      .catch(() => setSessions([]));
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Book, join and manage your skill exchanges.</p>
        </div>
        <Button href="/discover" size="sm">
          <Compass size={15} /> Find a teacher
        </Button>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {sessions === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[170px] rounded-2xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={tab === "upcoming" || tab === "pending" ? <CalendarDays className="h-6 w-6" /> : <CalendarPlus className="h-6 w-6" />}
          title={tab === "cancelled" ? "No cancelled sessions" : tab === "completed" ? "No completed sessions yet" : "No sessions here yet"}
          description={
            tab === "completed"
              ? "Teach or learn to complete your first session — reviews and credits follow."
              : "Find someone who teaches what you want to learn and book your first swap."
          }
          action={
            tab !== "cancelled" && (
              <Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary/90">
                <Compass size={15} /> Discover people
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} viewerId={user?.id ?? ""} />
          ))}
        </div>
      )}
    </div>
  );
}
