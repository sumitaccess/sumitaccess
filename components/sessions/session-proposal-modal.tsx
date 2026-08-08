"use client";

import * as React from "react";
import { CalendarDays, Clock, Coins, Video, MapPin, Loader2 } from "lucide-react";
import { get, post } from "@/lib/client";
import { toastError } from "@/components/toasts";
import { Button, Field, Modal, Select, Skeleton, Textarea } from "../ui";
import { SkillChip } from "../shared";
import { addMinutes } from "@/lib/utils";
import type { SafeUser, Skill, UserSkill } from "@/types";

export function SessionProposalModal({ open, onClose, partner, partnerId, onBooked, defaultSkillId }: { open: boolean; onClose: () => void; partner?: SafeUser; partnerId?: string; onBooked?: () => void; defaultSkillId?: string }) {
  const [teach, setTeach] = React.useState<(UserSkill & { skill: Skill })[] | null>(null);
  const [skillId, setSkillId] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("19:00");
  const [duration, setDuration] = React.useState(60);
  const [sessionType, setSessionType] = React.useState<"ONLINE" | "IN_PERSON">("ONLINE");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const targetId = partnerId ?? partner?.id ?? "";

  React.useEffect(() => {
    if (!open || !partner?.username) return;
    get<{ teach: (UserSkill & { skill: Skill })[] }>(`/api/users/${partner.username}`)
      .then((res) => {
        setTeach(res.teach);
        setSkillId((prev) => prev || defaultSkillId || res.teach[0]?.skill.id || "");
      })
      .catch(() => setTeach([]));
  }, [open, partner, defaultSkillId]);

  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const submit = async () => {
    if (!skillId) return toastError("Choose a skill", `Pick what you want to learn from ${partner?.name.split(" ")[0]}.`);
    if (!date) return toastError("Pick a date", "Choose when you'd like the session.");
    const start = new Date(`${date}T${time || "19:00"}`);
    if (Number.isNaN(start.getTime())) return toastError("Invalid time", "Please pick a valid time.");
    if (start.getTime() < Date.now()) return toastError("Past time", "Pick a time in the future.");

    setSending(true);
    try {
      await post("/api/sessions", {
        teacherId: targetId,
        skillId,
        startTime: start.toISOString(),
        duration,
        sessionType,
        title: title.trim() || null,
        description: description.trim() || null,
        credits: 1,
      });
      onBooked?.();
      onClose();
    } catch (err) {
      toastError("Couldn't book session", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  const skill = teach?.find((s) => s.skill.id === skillId)?.skill;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={partner ? `Book a session with ${partner.name.split(" ")[0]}` : "Propose a session"}
      description="You'll spend 1 Skill Credit when the teacher confirms."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={sending}><CalendarDays size={15} /> Send request</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Skill">
          {teach === null ? (
            <div className="flex gap-2"><Skeleton className="h-9 w-32 rounded-full" /><Skeleton className="h-9 w-24 rounded-full" /></div>
          ) : teach.length === 0 ? (
            <p className="text-sm text-muted-foreground">{partner?.name.split(" ")[0]} hasn't added teaching skills yet. Message them to plan something.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teach.map((ts) => (
                <button key={ts.id} onClick={() => setSkillId(ts.skill.id)} className="outline-none" type="button">
                  <SkillChip skill={ts.skill} size="md" className={skillId === ts.skill.id ? "border-primary bg-primary/10 text-primary shadow-glow" : ""} />
                </button>
              ))}
            </div>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-soft focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-soft focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Duration">
            <Select value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </Select>
          </Field>
          <Field label="Session type">
            <Select value={sessionType} onChange={(e) => setSessionType(e.target.value as "ONLINE" | "IN_PERSON")}>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In-person</option>
            </Select>
          </Field>
          <Field label="Credits">
            <Select value="1" disabled>
              <option value="1">1 credit</option>
            </Select>
          </Field>
        </div>

        <Field label="Title (optional)">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={skill ? `Learning ${skill.name} with ${partner?.name.split(" ")[0]}` : "What should this session cover?"}
            maxLength={100}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-soft focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </Field>
        <Field label="Notes (optional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Anything the teacher should know before we start?" maxLength={500} />
        </Field>

        {date && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <CalendarDays size={15} className="text-primary" />
              {new Date(`${date}T${time || "19:00"}`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Clock size={15} className="text-primary" />
              {time || "19:00"} – {addMinutes(new Date(`${date}T${time || "19:00"}`).toISOString(), duration).slice(11, 16)} ({duration} min)
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <Coins size={15} /> 1 Skill Credit
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              {sessionType === "ONLINE" ? <Video size={15} /> : <MapPin size={15} />} {sessionType === "ONLINE" ? "Online" : "In person"}
            </span>
          </div>
        )}
        {sending && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 size={12} className="animate-spin" /> Sending request…</p>}
      </div>
    </Modal>
  );
}
