"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ArrowRightLeft, Check, X, UserCheck } from "lucide-react";
import { Button, Card } from "../ui";
import { SwapRequestModal } from "./swap-request-modal";
import { post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import type { Match, SafeUser, Skill, UserSkill } from "@/types";

export function ProfileActions({
  target,
  myName,
  theirTeach,
  myTeach,
  relationship,
  matchScore,
  initialSwapOpen = false,
}: {
  target: SafeUser;
  myName: string;
  theirTeach: (UserSkill & { skill: Skill })[];
  myTeach: (UserSkill & { skill: Skill })[];
  relationship: Match | null;
  matchScore: number;
  initialSwapOpen?: boolean;
}) {
  const router = useRouter();
  const [swapOpen, setSwapOpen] = React.useState(initialSwapOpen);
  const [busy, setBusy] = React.useState(false);

  const message = async () => {
    setBusy(true);
    try {
      const res = await post<{ conversation: { id: string } }>("/api/conversations", { userId: target.id });
      router.push(`/messages/${res.conversation.id}`);
    } catch (err) {
      toastError("Couldn't open chat", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const respond = async (action: "ACCEPT" | "REJECT") => {
    if (!relationship) return;
    setBusy(true);
    try {
      await post(`/api/matches/${relationship.id}`, { action });
      toastSuccess(action === "ACCEPT" ? "You're matched! 🎉" : "Declined.");
      router.refresh();
    } catch (err) {
      toastError("Couldn't respond", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-wrap items-center gap-3 p-5">
      <div className="mr-auto flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserCheck size={18} />
        </span>
        <div>
          <p className="text-sm font-bold">
            {relationship?.status === "ACCEPTED" && "You're matched!"}
            {relationship?.status === "PENDING" && "Swap request pending"}
            {!relationship && `Ready to swap with ${target.name.split(" ")[0]}?`}
          </p>
          {matchScore > 0 && <p className="text-xs text-muted-foreground">{matchScore}% SkillSwap compatibility</p>}
        </div>
      </div>

      {relationship?.status === "PENDING" && relationship.userBId === target.id && (
        <>
          <Button variant="success" size="sm" loading={busy} onClick={() => respond("ACCEPT")}>
            <Check size={14} /> Accept
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => respond("REJECT")}>
            <X size={14} /> Decline
          </Button>
        </>
      )}
      {relationship?.status === "ACCEPTED" ? (
        <Button size="sm" onClick={message} loading={busy}>
          <MessageCircle size={14} /> Message
        </Button>
      ) : relationship?.status === "PENDING" ? (
        <Button size="sm" variant="outline" onClick={message} loading={busy}>
          <MessageCircle size={14} /> Message
        </Button>
      ) : (
        <Button size="md" onClick={() => setSwapOpen(true)}>
          <ArrowRightLeft size={15} /> Send Swap Request
        </Button>
      )}
      {!relationship && (
        <Button size="md" variant="outline" onClick={message} loading={busy}>
          <MessageCircle size={15} /> Message
        </Button>
      )}

      <SwapRequestModal open={swapOpen} onClose={() => setSwapOpen(false)} target={target} theirTeach={theirTeach} myTeach={myTeach} myName={myName} />
    </Card>
  );
}
