"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, ArrowRightLeft, BadgeCheck } from "lucide-react";
import { Avatar, Badge, Button, Card } from "../ui";
import { MatchRing, SkillChip } from "../shared";
import { post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import type { PersonCard as PersonCardType, SafeUser } from "@/types";

export function PersonCard({ person, compact, onAction }: { person: PersonCardType; compact?: boolean; onAction?: () => void }) {
  const router = useRouter();
  const [sending, setSending] = React.useState(false);
  const u = person.user;

  const startConversation = async () => {
    setSending(true);
    try {
      const res = await post<{ conversation: { id: string } }>("/api/conversations", { userId: u.id });
      onAction?.();
      router.push(`/messages/${res.conversation.id}`);
    } catch (err) {
      toastError("Couldn't open chat", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card hover className="flex h-full flex-col p-5">
        <div className="flex items-start gap-3.5">
          <div className="relative">
            <Avatar src={u.image} name={u.name} size="lg" />
            {u.verified && <BadgeCheck className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-sky-500 p-0.5 text-white" aria-label="Verified" />}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/users/${u.username}`} className="block truncate font-display text-[15px] font-bold hover:text-primary">
              {u.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{u.headline || "SkillSwap member"}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 2.5l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3-5.6-3.3-5.6 3.3 1.4-6.3L2.5 9l6.4-.6z" /></svg>
                {u.rating > 0 ? u.rating.toFixed(1) : "New"}
              </span>
              {u.rating > 0 && <span className="text-muted-foreground">({u.totalReviews})</span>}
              {u.location && (
                <span className="ml-1 inline-flex items-center gap-0.5 truncate text-muted-foreground">
                  <MapPin size={11} /> {u.location}
                </span>
              )}
            </div>
          </div>
          <MatchRing score={person.matchScore} size={54} />
        </div>

        <div className="mt-4 space-y-2.5">
          {person.teach.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Can teach</p>
              <div className="flex flex-wrap gap-1.5">
                {person.teach.slice(0, 3).map((ts) => (
                  <SkillChip key={ts.id} skill={ts.skill} type="TEACH" size="xs" />
                ))}
              </div>
            </div>
          )}
          {person.learn.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Wants to learn</p>
              <div className="flex flex-wrap gap-1.5">
                {person.learn.slice(0, 3).map((ls) => (
                  <SkillChip key={ls.id} skill={ls.skill} type="LEARN" size="xs" />
                ))}
              </div>
            </div>
          )}
        </div>

        {person.matchReasons.length > 0 && !compact && (
          <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-xs leading-relaxed text-primary/90">{person.matchReasons[0]}</p>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          {person.matchStatus === "ACCEPTED" ? (
            <Button variant="success" size="sm" className="flex-1" onClick={startConversation} loading={sending}>
              <MessageCircle size={14} /> Message
            </Button>
          ) : person.matchStatus === "PENDING" ? (
            <Button variant="secondary" size="sm" className="flex-1" disabled>
              Request pending
            </Button>
          ) : (
            <Button size="sm" className="flex-1" href={`/users/${u.username}?swap=1`}>
              <ArrowRightLeft size={14} /> Swap request
            </Button>
          )}
          <Button variant="outline" size="sm" href={`/users/${u.username}`}>
            View profile
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
