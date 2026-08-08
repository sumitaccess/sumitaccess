import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata = { title: "Community Guidelines" };

export default function GuidelinesPage() {
  return (
    <LegalLayout title="Community Guidelines" updated="8 August 2026">
      <p>SkillSwap only works when it's kind. These guidelines keep the space safe and generous for everyone.</p>
      <h2>Be generous</h2>
      <p>Show up on time, prepared and curious. Teaching is a gift — treat it that way, and learners should show their appreciation in kind.</p>
      <h2>Be respectful</h2>
      <p>No harassment, hate speech, discrimination, or inappropriate messages. Disagreements about skills are fine; personal attacks are not.</p>
      <h2>Be honest</h2>
      <p>Don't misrepresent your experience, create fake accounts, or game reviews or credits. Your reputation is your currency here.</p>
      <h2>Keep it on SkillSwap</h2>
      <p>For safety, keep communication on the platform until you've met and built trust. Never share sensitive personal details publicly.</p>
      <h2>Report, don't retaliate</h2>
      <p>If someone breaks these guidelines, use the report button. Our safety team reviews every report — retaliation makes things worse for everyone.</p>
    </LegalLayout>
  );
}
