import { getCurrentUser } from "@/lib/session";
import { safeUser } from "@/lib/users";
import { get } from "@/lib/db";
import { ChatWindow } from "@/components/messaging/chat-window";

export default async function ChatPage({ params }: { params: { conversationId: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const conv = get<{ userAId: string; userBId: string }>(
    "SELECT user_a_id AS userAId, user_b_id AS userBId FROM conversations WHERE id = ?",
    [params.conversationId],
  );
  if (!conv || (conv.userAId !== user.id && conv.userBId !== user.id)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">This conversation isn't available.</p>
      </div>
    );
  }
  const otherId = conv.userAId === user.id ? conv.userBId : conv.userAId;
  const other = safeUser(await import("@/lib/users").then((m) => m.getUserById(otherId)));
  if (!other) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-30 bg-background lg:static lg:z-auto lg:block lg:h-[calc(100vh-7rem)] lg:bg-transparent">
      <div className="flex h-full gap-4">
        <div className="hidden w-80 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:block">
          <ConversationListClient activeId={params.conversationId} />
        </div>
        <div className="min-w-0 flex-1">
          <ChatWindow conversationId={params.conversationId} me={safeUser(user)!} other={other} />
        </div>
      </div>
    </div>
  );
}

import { ConversationList } from "@/components/messaging/conversation-list";

function ConversationListClient({ activeId }: { activeId: string }) {
  return <ConversationList activeId={activeId} />;
}
