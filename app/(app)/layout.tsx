import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getWallet } from "@/lib/credits";
import { unreadCount } from "@/lib/notifications";
import { unreadMessagesCount } from "@/lib/messaging";
import { getUserSkills } from "@/lib/users";
import { AppShell } from "@/components/layout/app-shell";
import { UserProvider, type ClientUser } from "@/hooks/useUser";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");
  if (user.status === "SUSPENDED") redirect("/suspended");

  const wallet = getWallet(user.id);
  const teach = getUserSkills(user.id, "TEACH");
  const learn = getUserSkills(user.id, "LEARN");
  const onboardingComplete = Boolean(user.headline || user.location || user.availability || teach.length > 0 || learn.length > 0);

  if (!onboardingComplete && user.role !== "ADMIN") {
    redirect("/onboarding");
  }

  const clientUser: ClientUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    image: user.image,
    role: user.role,
    credits: wallet.balance,
    rating: user.rating,
    totalReviews: user.totalReviews,
    verified: user.verified,
    unreadNotifications: unreadCount(user.id),
    unreadMessages: unreadMessagesCount(user.id),
    onboardingComplete,
  };

  return (
    <UserProvider user={clientUser}>
      <AppShell user={clientUser}>{children}</AppShell>
    </UserProvider>
  );
}
