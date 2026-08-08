"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarPlus, Send, Smile, Paperclip, X } from "lucide-react";
import { get, post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import { Avatar, Button } from "../ui";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Message, SafeUser } from "@/types";
import { SessionProposalModal } from "@/components/sessions/session-proposal-modal";

const EMOJIS = ["👍", "🙏", "🎉", "🔥", "😄", "❤️", "🤝", "💡", "👏", "✨"];

export function ChatWindow({ conversationId, me, other }: { conversationId: string; me: SafeUser; other: SafeUser }) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [showEmoji, setShowEmoji] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [proposeOpen, setProposeOpen] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await get<{ messages: Message[] }>(`/api/conversations/${conversationId}`);
      setMessages(res.messages);
    } catch {
      /* conversation may have been deleted */
    }
  }, [conversationId]);

  React.useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    setDraft("");
    setSending(true);
    try {
      const res = await post<{ message: Message }>(`/api/conversations/${conversationId}/messages`, { content });
      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      setDraft(content);
      toastError("Couldn't send", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  const onUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toastError("Only images can be attached right now");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await post<{ url: string }>("/api/upload", { dataUrl, kind: "attachment" });
      await post(`/api/conversations/${conversationId}/messages`, { content: "Sent an image", attachment: { url: res.url, type: "image" } });
      void load();
    } catch {
      toastError("Upload failed", "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => router.push("/messages")} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden" aria-label="Back to conversations">
          <ArrowLeft size={18} />
        </button>
        <Link href={`/users/${other.username}`} className="flex min-w-0 items-center gap-3">
          <Avatar src={other.image} name={other.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{other.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{other.headline || `@${other.username}`}</span>
          </span>
        </Link>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setProposeOpen(true)}>
          <CalendarPlus size={14} /> Propose a session
        </Button>
      </div>

      {/* messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/15 px-4 py-4">
        {messages.map((m, i) => {
          const mine = m.senderId === me.id;
          const prev = messages[i - 1];
          const showDay = !prev || prev.createdAt.slice(0, 10) !== m.createdAt.slice(0, 10);
          return (
            <React.Fragment key={m.id}>
              {showDay && (
                <p className="pt-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-soft sm:max-w-[65%]", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card")}>
                  {m.attachment && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.attachment} alt="Attachment" className="mb-2 max-h-56 w-full rounded-xl object-cover" />
                  )}
                  {m.content !== "Sent an image" && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.content}</p>}
                  <p className={cn("mt-1 text-right text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <div className="border-t border-border p-3">
        {showEmoji && (
          <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-2">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => { setDraft((d) => d + e); setShowEmoji(false); }} className="rounded-lg p-1.5 text-lg hover:bg-secondary" aria-label={`Add ${e}`}>
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUpload(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Attach image" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
            <Paperclip size={16} className={cn(uploading && "animate-spin")} />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            placeholder={`Message ${other.name.split(" ")[0]}…`}
            rows={1}
            aria-label="Message"
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <button onClick={() => setShowEmoji((v) => !v)} aria-label="Emoji" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground">
            <Smile size={16} />
          </button>
          <Button onClick={() => void send(draft)} loading={sending} size="icon" aria-label="Send message">
            <Send size={15} />
          </Button>
        </div>
      </div>

      <SessionProposalModal open={proposeOpen} onClose={() => setProposeOpen(false)} partner={other} partnerId={other.id} onBooked={() => { setProposeOpen(false); toastSuccess("Session request sent!", `${other.name.split(" ")[0]} will confirm shortly.`); }} />
    </div>
  );
}
