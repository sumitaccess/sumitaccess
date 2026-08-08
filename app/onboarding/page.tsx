import { redirect } from "next/navigation";
import { getAllSkills } from "@/lib/users";
import { getCurrentUser } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/onboarding");
  const skills = getAllSkills();
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-14">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <OnboardingForm initialSkills={skills} />
    </div>
  );
}
