"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Video, MapPin, MessageCircle, Check, X, Flag, Star, ExternalLink, Coins } from "lucide-react";
import { Avatar, Badge, Button, Card, Modal, Stars, Textarea } from "../ui";
import { SkillChip } from "../shared";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import { REPORT_REASONS } from "@/lib/constants";
import type { SessionDetail } from "@/lib/sessions";

export function SessionCard({ session, viewerId }: { session: SessionDetail; viewerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const isTeacher = session.teacherId === viewerId;
  const partner = isTeacher ? session.learner : session.teacher;
  const mySide = isTeacher ? "You teach" : "You learn";
  const isPast = new Date(session.endTime).getTime() < Date.now();
  const reviewable = session.status === "COMPLETED" && !session.review && (isTeacher || isLearner(session, viewerId));

  const act = async (action: string, successMsg: string) => {
    setBusy(action);
    try {
      await post(`/api/sessions/${session.id}`, { action });
      toastSuccess(successMsg);
      router.refresh();
    } catch (err) {
      toastError("Action failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={partner.image} name={partner.name} size="md" />
          <div>
            <p className="text-sm font-bold">
              {partner.name} <span className="font-medium text-muted-foreground">· {mySide}</span>
            </p>
            <p className="text-xs text-muted-foreground">{session.title || `${session.skill.name} session`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(session.status)}>{statusLabel(session.status)}</Badge>
          {session.status === "COMPLETED" && session.review && <Badge variant="success"><Star size={10} className="fill-current" /> Reviewed</Badge>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {formatDateTime(session.startTime)}</span>
        <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {session.duration} min</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-primary"><Coins size={14} /> {session.credits} credit{session.credits > 1 ? "s" : ""}</span>
        <span className="inline-flex items-center gap-1.5">
          {session.sessionType === "ONLINE" ? <Video size={14} /> : <MapPin size={14} />}
          {session.sessionType === "ONLINE" ? "Online" : session.location || "In person"}
        </span>
        {session.description && <span className="w-full text-xs text-muted-foreground/90">{session.description}</span>}
      </div>

      <div className="mt-3">
        <SkillChip skill={session.skill} size="sm" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {session.status === "REQUESTED" && isTeacher && (
          <>
            <Button size="sm" variant="success" loading={busy === "CONFIRM"} onClick={() => act("CONFIRM", "Session confirmed 🎉")}>
              <Check size={14} /> Confirm
            </Button>
            <Button size="sm" variant="outline" loading={busy === "DECLINE"} onClick={() => act("DECLINE", "Request declined.")}>
              <X size={14} /> Decline
            </Button>
          </>
        )}
        {session.status === "REQUESTED" && !isTeacher && (
          <p className="text-xs text-muted-foreground">Waiting for {partner.name.split(" ")[0]} to confirm…</p>
        )}
        {session.status === "CONFIRMED" && session.meetingUrl && !isPast && (
          <Button size="sm" variant="success" href={session.meetingUrl} target="_blank">
            <Video size={14} /> Join session
          </Button>
        )}
        {session.status === "CONFIRMED" && session.meetingUrl && isPast && (
          <Button size="sm" variant="secondary" onClick={() => act("COMPLETE", "Session marked complete ✨")} loading={busy === "COMPLETE"}>
            <Check size={14} /> Mark completed
          </Button>
        )}
        {session.status === "CONFIRMED" && !session.meetingUrl && (
          <Button size="sm" variant="secondary" onClick={() => act("COMPLETE", "Session marked complete ✨")} loading={busy === "COMPLETE"}>
            <Check size={14} /> Mark completed
          </Button>
        )}
        {["REQUESTED", "CONFIRMED"].includes(session.status) && (
          <Button size="sm" variant="outline" loading={busy === "CANCEL"} onClick={() => act("CANCEL", "Session cancelled.")}>
            Cancel
          </Button>
        )}
        {reviewable && (
          <Button size="sm" onClick={() => setReviewOpen(true)}>
            <Star size={14} /> Review
          </Button>
        )}
        <Button size="sm" variant="ghost" href={`/messages?with=${partner.id}`}>
          <MessageCircle size={14} /> Message
        </Button>
        {session.meetingUrl && (
          <Button size="sm" variant="ghost" href={session.meetingUrl} target="_blank" className="ml-auto">
            <ExternalLink size={14} /> Meeting link
          </Button>
        )}
        {session.status === "COMPLETED" && (
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => setReportOpen(true)}>
            <Flag size={13} /> Report
          </Button>
        )}
      </div>

      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} session={session} onDone={() => { setReviewOpen(false); router.refresh(); }} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} session={session} />
    </Card>
  );
}

function isLearner(s: SessionDetail, uid: string) {
  return s.learnerId === uid;
}

function statusVariant(status: string): "success" | "warning" | "secondary" | "destructive" {
  if (status === "CONFIRMED") return "success";
  if (status === "REQUESTED") return "warning";
  if (status === "COMPLETED") return "secondary";
  return "destructive";
}

function statusLabel(status: string): string {
  return { REQUESTED: "Pending", CONFIRMED: "Upcoming", COMPLETED: "Completed", CANCELLED: "Cancelled", DISPUTED: "Disputed" }[status] ?? status;
}

function ReviewModal({ open, onClose, session, onDone }: { open: boolean; onClose: () => void; session: SessionDetail; onDone: () => void }) {
  const [rating, setRating] = React.useState(5);
  const [tags, setTags] = React.useState<string[]>([]);
  const [comment, setComment] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await post(`/api/sessions/${session.id}/review`, { rating, tags, comment: comment || null });
      toastSuccess("Thanks for your review ⭐");
      onDone();
    } catch (err) {
      toastError("Couldn't submit review", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="How was your SkillSwap experience?" description="Your review helps the community make better swaps." footer={
      <>
        <Button variant="outline" onClick={onClose}>Not now</Button>
        <Button onClick={submit} loading={sending}>Submit review</Button>
      </>
    }>
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-semibold">{session.skill.name} · {relativeTime(session.endTime)}</p>
          <Stars rating={rating} size={30} interactive onChange={setRating} ariaLabel="Your rating" />
          <p className="text-sm font-bold text-amber-500">{["", "Poor", "Okay", "Good", "Great", "Excellent!"][rating]}</p>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold">What went well?</p>
          <div className="flex flex-wrap gap-2">
            {(["Helpful", "Friendly", "Knowledgeable", "Punctual", "Clear explanation", "Patient", "Great communicator", "Prepared"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                aria-pressed={tags.includes(t)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${tags.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground/30"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a few words about the session…" rows={3} maxLength={600} />
      </div>
    </Modal>
  );
}

function ReportModal({ open, onClose, session }: { open: boolean; onClose: () => void; session: SessionDetail }) {
  const [reason, setReason] = React.useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await post(`/api/sessions/${session.id}/report`, { reason, details: details || null });
      toastSuccess("Report received", "Our team will review this shortly.");
      onClose();
    } catch (err) {
      toastError("Couldn't send report", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Report this session" description="Reports are confidential and reviewed by our safety team." footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={submit} loading={sending}><Flag size={14} /> Send report</Button>
      </>
    }>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold">Reason</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3.5 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
            {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add details (optional)…" rows={3} maxLength={500} />
      </div>
    </Modal>
  );
}
