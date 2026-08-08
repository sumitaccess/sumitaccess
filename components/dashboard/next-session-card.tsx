"use client";

import Link from "next/link";
import { CalendarDays, Clock, Video, MapPin, ArrowRight } from "lucide-react";
import { Avatar, Badge } from "../ui";
import { formatDateTime } from "@/lib/utils";
import type { SessionDetail } from "@/lib/sessions";

export function NextSessionCard({ session, viewerId }: { session: SessionDetail; viewerId: string }) {
  const isTeacher = session.teacherId === viewerId;
  const partner = isTeacher ? session.learner : session.teacher;
  const role = isTeacher ? "You teach" : "You learn";

  return (
    <Link
      href="/sessions"
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
    >
      <Avatar src={partner.image} name={partner.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={session.status === "CONFIRMED" ? "success" : "warning"}>
            {session.status === "CONFIRMED" ? "Confirmed" : "Pending confirmation"}
          </Badge>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{role}</span>
        </div>
        <p className="mt-1 truncate font-display text-[15px] font-bold">
          {session.title || `${session.skill.name} with ${partner.name}`}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDateTime(session.startTime, undefined, "short")}</span>
          <span className="inline-flex items-center gap-1"><Clock size={12} /> {session.duration} min</span>
          {session.sessionType === "ONLINE" ? (
            <span className="inline-flex items-center gap-1"><Video size={12} /> Online</span>
          ) : (
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {session.location || "In person"}</span>
          )}
          <span className="inline-flex items-center gap-1 font-semibold text-primary">{session.credits} credit{session.credits > 1 ? "s" : ""}</span>
        </div>
      </div>
      <ArrowRight size={17} className="shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
