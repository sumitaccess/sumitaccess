import Link from "next/link";
import { ShieldCheck, Flag, Eye, Lock, HeartHandshake } from "lucide-react";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata = { title: "Safety Center" };

export default function SafetyPage() {
  const items = [
    { icon: <ShieldCheck size={18} />, title: "Verification badges", body: "Profiles we've verified carry a blue badge. It's earned, not bought." },
    { icon: <Flag size={18} />, title: "Report anything", body: "Every profile and session has a report action. Reports are confidential and reviewed by real humans." },
    { icon: <Lock size={18} />, title: "Privacy by design", body: "Email addresses and balances are never public. Messages stay between participants." },
    { icon: <Eye size={18} />, title: "Reviews keep it honest", body: "Both sides review after every completed session — reputation travels with you." },
    { icon: <HeartHandshake size={18} />, title: "Dispute resolution", body: "Disagreements happen. Our team can cancel sessions, refund credits and mediate fairly." },
  ];
  return (
    <LegalLayout title="Safety Center" updated="8 August 2026">
      <p>Feeling safe is a feature, not an afterthought. Here's how SkillSwap protects its members.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.title} className="rounded-2xl border border-border bg-card p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{i.icon}</span>
            <h3 className="font-display mt-3 text-base font-bold">{i.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>
      <h2>Need help right now?</h2>
      <p>
        Contact our team at <a href="mailto:safety@skillswap.app" className="font-bold text-primary">safety@skillswap.app</a> or read our{" "}
        <Link href="/guidelines" className="font-bold text-primary underline-offset-4 hover:underline">Community Guidelines</Link> and{" "}
        <Link href="/terms" className="font-bold text-primary underline-offset-4 hover:underline">Terms</Link>.
      </p>
    </LegalLayout>
  );
}
