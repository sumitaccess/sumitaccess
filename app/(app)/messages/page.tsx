"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/messaging/conversation-list";
import { post } from "@/lib/client";


export default function MessagesPage() {
  const router = useRouter();
  const params = useSearchParams();

  // Support /messages?with=<userId> — open (or create) the conversation
  React.useEffect(() => {
    const withId = params.get("with");
    if (!withId) return;
    post<{ conversation: { id: string } }>("/api/conversations", { userId: withId })
      .then((res) => router.replace(`/messages/${res.conversation.id}`))
      .catch(() => {});
  }, [params, router]);

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {/* list pane (always visible here) */}
      <div className="w-full border-r border-border md:w-80 md:shrink-0">
        <div className="border-b border-border px-4 py-3.5">
          <h1 className="font-display text-lg font-extrabold">Messages</h1>
        </div>
        <div className="h-[calc(100%-3.5rem)]">
          <ConversationList />
        </div>
      </div>
      {/* empty chat pane (desktop) */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-secondary/20 p-8 md:flex">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquare size={24} />
        </span>
        <p className="mt-4 font-display text-base font-bold">Select a conversation</p>
        <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
          Chat with your matches, plan sessions, and keep the momentum going.
        </p>
      </div>
    </div>
  );
}
