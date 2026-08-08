"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Inbox } from "lucide-react";
import { Avatar, Button } from "../ui";
import { post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";

export interface IncomingRequest {
  id: string;
  userAId: string;
  skillName?: string;
}

export function IncomingRequests({ requests }: { requests: IncomingRequest[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const respond = async (matchId: string, action: "ACCEPT" | "REJECT") => {
    setBusy(matchId);
    try {
      const res = await post<{ message: string }>(`/api/matches/${matchId}`, { action });
      toastSuccess(action === "ACCEPT" ? "You're matched! 🎉" : res.message);
      router.refresh();
    } catch (err) {
      toastError("Couldn't respond", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Inbox size={16} /></span>
        <h2 className="font-display text-base font-bold">Swap requests waiting for you</h2>
      </div>
      <div className="space-y-3">
        {requests.map((m) => (
          <RequestRow key={m.id} matchId={m.id} requesterId={m.userAId} skillName={m.skillName} busy={busy === m.id} onRespond={(a) => respond(m.id, a)} />
        ))}
      </div>
    </div>
  );
}

function RequestRow({ matchId, requesterId, skillName, busy, onRespond }: { matchId: string; requesterId: string; skillName?: string; busy: boolean; onRespond: (action: "ACCEPT" | "REJECT") => void }) {
  const [requester, setRequester] = React.useState<{ name: string; username: string; image: string | null; headline: string | null } | null>(null);

  React.useEffect(() => {
    fetch(`/api/users/by-id/${requesterId}`)
      .then((r) => r.json())
      .then((res) => res.success && setRequester(res.data.user))
      .catch(() => {});
  }, [requesterId]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <Avatar src={requester?.image} name={requester?.name ?? "Member"} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {requester ? (
            <Link href={`/users/${requester.username}`} className="hover:text-primary">{requester.name}</Link>
          ) : (
            "Someone"
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          wants to {skillName ? <>learn <span className="font-semibold text-foreground">{skillName}</span> from you</> : "swap skills with you"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="success" loading={busy} onClick={() => onRespond("ACCEPT")}>
          <Check size={14} /> Accept
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onRespond("REJECT")}>
          <X size={14} /> Decline
        </Button>
      </div>
    </div>
  );
}
