import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="8 August 2026">
      <p>Welcome to SkillSwap, a peer-to-peer platform where members exchange skills using Skill Credits. By creating an account or using the platform, you agree to these terms.</p>
      <h2>1. Skill Credits</h2>
      <p>SkillSwap uses a credit system instead of cash. One hour of teaching generally earns one Skill Credit. Credits are not redeemable for money, cannot be transferred between accounts without authorisation, and have no cash value.</p>
      <h2>2. Conduct</h2>
      <p>You agree to treat other members with respect. Harassment, discrimination, scams, spam, and abusive behaviour are grounds for suspension or removal. Sessions you commit to should be attended — repeated no-shows hurt the community.</p>
      <h2>3. Your content</h2>
      <p>You keep ownership of the content you post. You grant SkillSwap a licence to display it on the platform. Don't post content you don't have the right to share.</p>
      <h2>4. Disputes</h2>
      <p>If a session goes wrong, our team can mediate. We may cancel sessions, refund credits, or adjust balances where we judge it fair. Reports are reviewed by our safety team.</p>
      <h2>5. Liability</h2>
      <p>SkillSwap is a platform connecting people — the skills taught are provided by members, not by SkillSwap. We are not liable for the outcome of any session, including advice given or services rendered by members.</p>
      <h2>6. Changes</h2>
      <p>We may update these terms. Continued use after changes means you accept them. We'll notify you of material changes.</p>
    </LegalLayout>
  );
}
