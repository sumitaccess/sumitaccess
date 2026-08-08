import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="8 August 2026">
      <p>Your privacy matters. This policy explains what we collect, why, and how you stay in control.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email, password (hashed), profile photo.</li>
        <li>Skill profile: skills you teach and want to learn, experience levels, availability, location, timezone.</li>
        <li>Activity: matches, messages, sessions, reviews, and credit transactions.</li>
        <li>Usage data: pages visited and interactions, used to improve the product.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To match you with compatible people, run sessions, protect the community, and improve the platform. We never sell your personal data.</p>
      <h2>What's public</h2>
      <p>Your name, photo, headline, skills, availability summary and reviews are visible to other members — that's what makes matching work. Your email address and credit balance are never shown publicly.</p>
      <h2>Your controls</h2>
      <p>You can edit or delete profile information in Settings, and contact us to delete your account. Messages can be deleted by either participant.</p>
      <h2>Security</h2>
      <p>Passwords are hashed, connections are encrypted, and sensitive fields are never exposed through the API.</p>
    </LegalLayout>
  );
}
