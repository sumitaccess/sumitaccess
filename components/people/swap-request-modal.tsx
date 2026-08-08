"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowRightLeft, Sparkles } from "lucide-react";
import { Avatar, Button, Field, Modal, Textarea } from "../ui";
import { SkillChip } from "../shared";
import { post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import type { SafeUser, Skill, UserSkill } from "@/types";

export function SwapRequestModal({
  open,
  onClose,
  target,
  theirTeach,
  myTeach,
  myName,
}: {
  open: boolean;
  onClose: () => void;
  target: SafeUser;
  theirTeach: (UserSkill & { skill: Skill })[];
  myTeach: (UserSkill & { skill: Skill })[];
  myName: string;
}) {
  const router = useRouter();
  const [want, setWant] = React.useState<string>("");
  const [offer, setOffer] = React.useState<string>("");
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setWant(theirTeach[0]?.skill.id ?? "");
      setOffer(myTeach[0]?.skill.id ?? "");
      setMessage(`Hi ${target.name.split(" ")[0]}! I'd love to learn ${theirTeach[0]?.skill.name ?? "your skill"} from you. I can help you with ${myTeach[0]?.skill.name ?? "my skills"} in return.`);
    }
  }, [open, target, theirTeach, myTeach]);

  const send = async () => {
    if (!want) {
      toastError("Choose a skill", "Pick what you want to learn first.");
      return;
    }
    setSending(true);
    try {
      await post("/api/matches", {
        targetId: target.id,
        requestedSkillId: want,
        offeredSkillId: offer || null,
        message,
      });
      toastSuccess("Swap request sent 🎉", `${target.name.split(" ")[0]} will get a notification.`);
      onClose();
      router.refresh();
    } catch (err) {
      toastError("Couldn't send request", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  const wantSkill = theirTeach.find((s) => s.skill.id === want)?.skill;
  const offerSkill = myTeach.find((s) => s.skill.id === offer)?.skill;

  return (
    <Modal open={open} onClose={onClose} title="Send a swap request" description="You're one message away from a skill exchange." footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={send} loading={sending}><Send size={15} /> Send Request</Button>
      </>
    }>
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3.5">
          <Avatar src={target.image} name={target.name} size="sm" />
          <p className="text-sm">
            You want to learn <span className="font-bold">{wantSkill?.name ?? "a skill"}</span> from{" "}
            <span className="font-bold">{target.name}</span>.
          </p>
        </div>

        <Field label={`What do you want to learn from ${target.name.split(" ")[0]}?`}>
          <div className="flex flex-wrap gap-2">
            {theirTeach.map((ts) => (
              <button key={ts.id} onClick={() => setWant(ts.skill.id)} aria-pressed={want === ts.skill.id} className="outline-none">
                <SkillChip skill={ts.skill} size="md" className={want === ts.skill.id ? "border-primary bg-primary/10 text-primary shadow-glow" : ""} />
              </button>
            ))}
          </div>
        </Field>

        <Field label="What can you teach in return?" hint="A two-way swap is what makes SkillSwap work.">
          <div className="flex flex-wrap gap-2">
            {myTeach.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                You haven't added teaching skills yet.{" "}
                <button onClick={() => router.push("/settings")} className="font-bold text-primary hover:underline">Add some</button> — or skip for now.
              </p>
            ) : (
              myTeach.map((ts) => (
                <button key={ts.id} onClick={() => setOffer(ts.skill.id)} aria-pressed={offer === ts.skill.id} className="outline-none">
                  <SkillChip skill={ts.skill} size="md" className={offer === ts.skill.id ? "border-primary bg-primary/10 text-primary shadow-glow" : ""} />
                </button>
              ))
            )}
          </div>
        </Field>

        {wantSkill && offerSkill && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-center text-xs font-semibold text-primary">
            <Sparkles size={13} /> You teach {offerSkill.name} ↔ they teach {wantSkill.name}
            <ArrowRightLeft size={13} />
          </div>
        )}

        <Field label="Your message">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} />
        </Field>
      </div>
    </Modal>
  );
}
