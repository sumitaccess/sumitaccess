"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { Avatar, Skeleton } from "../ui";
import { get } from "@/lib/client";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ConversationWithUser } from "@/types";

export function ConversationList({ activeId, onSelect }: { activeId?: string; onSelect?: () => void }) {
  const [conversations, setConversations] = React.useState<ConversationWithUser[] | null>(null);
  const [q, setQ] = React.useState("");
  const pathname = usePathname();

  React.useEffect(() => {
    get<{ conversations: ConversationWithUser[] }>("/api/conversations")
      .then((res) => setConversations(res.conversations))
      .catch(() => setConversations([]));
  }, [pathname, activeId]);

  const filtered = (conversations ?? []).filter(
    (c) => !q || c.otherUser.name.toLowerCase().includes(q.toLowerCase()),
  );

  if (!conversations) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative p-3 pb-2">
        <Search className="pointer-events-none absolute left-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search conversations…"
          aria-label="Search conversations"
          className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-bold">No conversations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Message someone from a profile, or send a swap request — matched members land here.
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const active = activeId === c.id;
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                onClick={onSelect}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  active ? "bg-primary/10" : "hover:bg-secondary",
                )}
              >
                <Avatar src={c.otherUser.image} name={c.otherUser.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold">{c.otherUser.name}</p>
                    {c.lastMessageAt && <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(c.lastMessageAt)}</span>}
                  </div>
                  <p className={cn("truncate text-xs", c.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {c.lastMessage || "Say hello 👋"}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
