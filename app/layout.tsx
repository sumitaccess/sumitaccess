import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { ServiceWorkerRegistration } from "./sw-register";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "SkillSwap — Your skills are worth something",
    template: "%s · SkillSwap",
  },
  description:
    "Teach what you know. Learn what you love. SkillSwap is a peer-to-peer marketplace where you exchange skills using Skill Credits — no money, just time and knowledge.",
  keywords: ["skill exchange", "peer to peer learning", "teach", "learn", "skill credits", "mentorship", "SkillSwap"],
  openGraph: {
    type: "website",
    siteName: "SkillSwap",
    title: "SkillSwap — Your skills are worth something",
    description: "Teach what you know. Learn what you love. Exchange skills with people who can help you grow.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", title: "SkillSwap — Your skills are worth something", description: "Teach what you know. Learn what you love." },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-512.png", apple: "/icon-512.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          {children}
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
