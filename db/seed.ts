// ============================================================================
// SkillSwap — development seed.
// Creates the demo user (demo@skillswap.app), ~24 realistic community members,
// the full skill catalogue, user-skill relationships, matches (computed with
// the real matching engine), sessions, reviews, credit transactions,
// conversations and notifications.
//
// Run: npm run db:setup   (or: tsx db/seed.ts)
// ============================================================================

import bcrypt from "bcryptjs";
import { applySchema, get, query, run } from "../lib/db";
import { newId, nowIso } from "../lib/ids";
import { AVAILABILITY_PRESETS, SKILL_CATALOGUE, STARTER_CREDITS } from "../lib/constants";
import { createUser, getSkillsForUsers } from "../lib/users";
import { computeMatch } from "../lib/matching";
import { addMinutes } from "../lib/utils";
import type { Skill, User } from "../types";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo1234";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";
const SEED_PASSWORD = process.env.SEED_PASSWORD || "skillswap123";

function wipe(): void {
  for (const t of [
    "reports", "notifications", "credit_transactions", "reviews", "messages", "conversations",
    "sessions", "matches", "user_skills", "skills", "users",
  ]) {
    run(`DELETE FROM ${t}`);
  }
}

const AV_PRESETS: Record<string, string> = Object.fromEntries(
  AVAILABILITY_PRESETS.map((p) => [p.key, JSON.stringify(p.value)]),
);

const AV = (key: string): string => AV_PRESETS[key] ?? "{}";

interface UserSeed {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  headline: string;
  location: string;
  timezone: string;
  languages: string;
  availability: string;
  onlinePref: string;
  verified: boolean;
  rating: number;
  reviews: number;
  completed: number;
  hours: number;
  teach: { slug: string; level: string; years: number }[];
  learn: { slug: string; level: string; years: number }[];
}

const USERS: UserSeed[] = [
  {
    name: "Sumit Sharma", email: "demo@skillswap.app", avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "GIS analyst by day, curious learner by evening. I help teams turn spatial data into decisions — and I'm now learning Python to automate the boring parts of my work.",
    headline: "GIS Specialist · Remote Sensing & QGIS", location: "Delhi, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.9, reviews: 27, completed: 21, hours: 24,
    teach: [{ slug: "qgis", level: "EXPERT", years: 7 }, { slug: "arcgis", level: "ADVANCED", years: 4 }, { slug: "remote-sensing", level: "ADVANCED", years: 5 }],
    learn: [{ slug: "python", level: "BEGINNER", years: 0 }, { slug: "data-analytics", level: "BEGINNER", years: 0 }, { slug: "ui-design", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Aarav Sharma", email: "aarav@example.com", avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    bio: "Product designer who loves systems thinking. I run design critique circles and I'm finally learning to code so I can ship what I design.",
    headline: "Product Designer · Figma & UI Design", location: "Delhi, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.9, reviews: 37, completed: 31, hours: 38,
    teach: [{ slug: "figma", level: "EXPERT", years: 6 }, { slug: "ui-design", level: "EXPERT", years: 6 }, { slug: "ux-research", level: "ADVANCED", years: 4 }],
    learn: [{ slug: "python", level: "BEGINNER", years: 0 }, { slug: "data-analytics", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Priya Patel", email: "priya@example.com", avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Data scientist at a fintech. I love explaining ML concepts without the jargon — from pandas to pipelines.",
    headline: "Data Scientist · Python & ML", location: "Mumbai, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi,Gujarati", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.8, reviews: 42, completed: 35, hours: 46,
    teach: [{ slug: "python", level: "EXPERT", years: 8 }, { slug: "machine-learning", level: "ADVANCED", years: 5 }, { slug: "data-analytics", level: "EXPERT", years: 6 }],
    learn: [{ slug: "figma", level: "BEGINNER", years: 0 }, { slug: "ui-design", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Rohan Mehta", email: "rohan@example.com", avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    bio: "Frontend engineer. I've built production React apps for 6 years and I'm equally happy reviewing your code or teaching hooks from scratch.",
    headline: "Frontend Engineer · React & TypeScript", location: "Bengaluru, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi", availability: AV("every-day-evening"), onlinePref: "ONLINE",
    verified: true, rating: 4.7, reviews: 29, completed: 24, hours: 30,
    teach: [{ slug: "react", level: "EXPERT", years: 6 }, { slug: "javascript", level: "ADVANCED", years: 7 }, { slug: "typescript", level: "ADVANCED", years: 4 }],
    learn: [{ slug: "guitar", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Ananya Iyer", email: "ananya@example.com", avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    bio: "Music teacher and performer. Guitar, piano, vocals — I tailor lessons to the songs you actually love.",
    headline: "Music Teacher · Guitar & Piano", location: "Chennai, India", timezone: "Asia/Kolkata",
    languages: "English,Tamil,Hindi", availability: AV("weekends"), onlinePref: "BOTH",
    verified: true, rating: 5.0, reviews: 53, completed: 47, hours: 60,
    teach: [{ slug: "guitar", level: "EXPERT", years: 12 }, { slug: "piano", level: "ADVANCED", years: 8 }, { slug: "singing", level: "ADVANCED", years: 9 }],
    learn: [{ slug: "sql", level: "BEGINNER", years: 0 }, { slug: "personal-finance", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Vikram Singh", email: "vikram@example.com", avatar: "https://randomuser.me/api/portraits/men/51.jpg",
    bio: "Geospatial consultant. QGIS, remote sensing and field mapping — I've digitised more watersheds than I can count.",
    headline: "Geospatial Consultant · QGIS", location: "Jaipur, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi", availability: AV("weekdays-mornings"), onlinePref: "ONLINE",
    verified: false, rating: 4.6, reviews: 14, completed: 12, hours: 16,
    teach: [{ slug: "qgis", level: "ADVANCED", years: 6 }, { slug: "remote-sensing", level: "INTERMEDIATE", years: 3 }],
    learn: [{ slug: "english", level: "INTERMEDIATE", years: 0 }, { slug: "public-speaking", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Sophia Fernandes", email: "sophia@example.com", avatar: "https://randomuser.me/api/portraits/women/21.jpg",
    bio: "Content strategist & copywriter. I'll help you find your voice, structure stories, and write things people actually finish reading.",
    headline: "Content Strategist · Writing & Marketing", location: "Mumbai, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.8, reviews: 33, completed: 28, hours: 32,
    teach: [{ slug: "content-writing", level: "EXPERT", years: 7 }, { slug: "social-media-marketing", level: "ADVANCED", years: 5 }],
    learn: [{ slug: "video-editing", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Arjun Nair", email: "arjun@example.com", avatar: "https://randomuser.me/api/portraits/men/41.jpg",
    bio: "Backend engineer, SQL enthusiast. Databases, APIs, and clean architecture — happy to go deep on indexing or explain ACID over coffee.",
    headline: "Backend Engineer · Java & SQL", location: "Bengaluru, India", timezone: "Asia/Kolkata",
    languages: "English,Malayalam,Hindi", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: false, rating: 4.7, reviews: 19, completed: 16, hours: 20,
    teach: [{ slug: "java", level: "ADVANCED", years: 7 }, { slug: "sql", level: "EXPERT", years: 6 }],
    learn: [{ slug: "react", level: "INTERMEDIATE", years: 1 }, { slug: "ui-design", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Isabella Rossi", email: "isabella@example.com", avatar: "https://randomuser.me/api/portraits/women/28.jpg",
    bio: "Senior product designer in London. I've shipped design systems for two unicorns and I'm learning Spanish for a big move to Madrid.",
    headline: "Product Designer · UX Research", location: "London, UK", timezone: "Europe/London",
    languages: "English,Italian", availability: AV("weekdays-mornings"), onlinePref: "ONLINE",
    verified: true, rating: 4.9, reviews: 41, completed: 34, hours: 40,
    teach: [{ slug: "ux-research", level: "EXPERT", years: 8 }, { slug: "ui-design", level: "EXPERT", years: 8 }, { slug: "figma", level: "ADVANCED", years: 6 }],
    learn: [{ slug: "spanish", level: "BEGINNER", years: 0 }],
  },
  {
    name: "David Kim", email: "david@example.com", avatar: "https://randomuser.me/api/portraits/men/64.jpg",
    bio: "Quant analyst in Singapore. I model risk by day and teach investing fundamentals by night.",
    headline: "Financial Analyst · Modeling & Investing", location: "Singapore", timezone: "Asia/Singapore",
    languages: "English,Chinese", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.8, reviews: 25, completed: 22, hours: 28,
    teach: [{ slug: "financial-modeling", level: "EXPERT", years: 9 }, { slug: "stock-investing", level: "ADVANCED", years: 8 }, { slug: "personal-finance", level: "ADVANCED", years: 7 }],
    learn: [{ slug: "python", level: "INTERMEDIATE", years: 1 }],
  },
  {
    name: "Emily Chen", email: "emily@example.com", avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    bio: "Yoga teacher & meditation coach. 10 years of practice, 500-hour certified. Let's find your calm.",
    headline: "Yoga Instructor · Meditation", location: "New York, USA", timezone: "America/New_York",
    languages: "English,Chinese", availability: AV("weekdays-mornings"), onlinePref: "ONLINE",
    verified: true, rating: 4.9, reviews: 48, completed: 40, hours: 55,
    teach: [{ slug: "yoga", level: "EXPERT", years: 10 }, { slug: "meditation", level: "ADVANCED", years: 8 }],
    learn: [{ slug: "cooking", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Fatima Al-Sayed", email: "fatima@example.com", avatar: "https://randomuser.me/api/portraits/women/57.jpg",
    bio: "Growth marketer in Dubai. I've scaled three DTC brands. SEO, funnels, retention — I love a good growth loop.",
    headline: "Growth Marketer · SEO & Content", location: "Dubai, UAE", timezone: "Asia/Dubai",
    languages: "English,Arabic", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: false, rating: 4.6, reviews: 17, completed: 14, hours: 18,
    teach: [{ slug: "marketing", level: "ADVANCED", years: 6 }, { slug: "seo", level: "ADVANCED", years: 5 }, { slug: "social-media-marketing", level: "ADVANCED", years: 5 }],
    learn: [{ slug: "french", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Rahul Verma", email: "rahul@example.com", avatar: "https://randomuser.me/api/portraits/men/86.jpg",
    bio: "Documentary photographer. Light, composition and telling stories with a single frame. Based in Pune.",
    headline: "Photographer · Storytelling", location: "Pune, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi,Marathi", availability: AV("weekends"), onlinePref: "BOTH",
    verified: false, rating: 4.7, reviews: 22, completed: 18, hours: 21,
    teach: [{ slug: "photography", level: "ADVANCED", years: 9 }, { slug: "mobile-photography", level: "ADVANCED", years: 4 }],
    learn: [{ slug: "marketing", level: "INTERMEDIATE", years: 1 }, { slug: "qgis", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Neha Gupta", email: "neha@example.com", avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    bio: "Frontend developer and CSS nerd. I make websites that feel great — and I'll show you how.",
    headline: "Frontend Developer · Web & JavaScript", location: "Delhi, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi", availability: AV("every-day-evening"), onlinePref: "ONLINE",
    verified: true, rating: 4.8, reviews: 26, completed: 21, hours: 26,
    teach: [{ slug: "web-development", level: "ADVANCED", years: 5 }, { slug: "javascript", level: "ADVANCED", years: 5 }],
    learn: [{ slug: "ui-design", level: "INTERMEDIATE", years: 1 }, { slug: "figma", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Carlos Mendes", email: "carlos@example.com", avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    bio: "Language coach from Madrid. I teach Spanish and English through conversation, not textbooks.",
    headline: "Language Coach · Spanish & English", location: "Toronto, Canada", timezone: "America/Toronto",
    languages: "English,Spanish,Portuguese", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.9, reviews: 39, completed: 33, hours: 42,
    teach: [{ slug: "spanish", level: "EXPERT", years: 11 }, { slug: "english", level: "EXPERT", years: 9 }],
    learn: [{ slug: "data-analytics", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Meera Krishnan", email: "meera@example.com", avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Analytics lead. Dashboards, SQL and storytelling with data. Teaching is how I cement my own understanding.",
    headline: "Analytics Lead · SQL & Data", location: "Bengaluru, India", timezone: "Asia/Kolkata",
    languages: "English,Tamil", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.8, reviews: 31, completed: 27, hours: 33,
    teach: [{ slug: "data-analytics", level: "EXPERT", years: 7 }, { slug: "sql", level: "ADVANCED", years: 5 }],
    learn: [{ slug: "machine-learning", level: "INTERMEDIATE", years: 1 }, { slug: "qgis", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Karan Malhotra", email: "karan@example.com", avatar: "https://randomuser.me/api/portraits/men/29.jpg",
    bio: "Fitness coach. Strength training and running — no bro science, just programming that works.",
    headline: "Fitness Coach · Strength & Running", location: "Mumbai, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi", availability: AV("weekdays-mornings"), onlinePref: "BOTH",
    verified: false, rating: 4.7, reviews: 20, completed: 17, hours: 22,
    teach: [{ slug: "strength-training", level: "ADVANCED", years: 7 }, { slug: "running", level: "INTERMEDIATE", years: 5 }],
    learn: [{ slug: "public-speaking", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Lakshmi Rao", email: "lakshmi@example.com", avatar: "https://randomuser.me/api/portraits/women/47.jpg",
    bio: "Finance manager. I keep the books tight and teach others to master their money.",
    headline: "Finance Manager · Personal Finance", location: "Hyderabad, India", timezone: "Asia/Kolkata",
    languages: "English,Telugu,Hindi", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.8, reviews: 24, completed: 20, hours: 25,
    teach: [{ slug: "personal-finance", level: "EXPERT", years: 9 }, { slug: "stock-investing", level: "ADVANCED", years: 6 }],
    learn: [{ slug: "remote-sensing", level: "BEGINNER", years: 0 }],
  },
  {
    name: "James Wilson", email: "james@example.com", avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    bio: "Chef and food writer in Sydney. From weeknight dal to weekend baking — cooking for real life.",
    headline: "Chef · Cooking & Baking", location: "Sydney, Australia", timezone: "Australia/Sydney",
    languages: "English", availability: AV("weekends"), onlinePref: "BOTH",
    verified: false, rating: 4.9, reviews: 18, completed: 15, hours: 19,
    teach: [{ slug: "cooking", level: "EXPERT", years: 15 }],
    learn: [{ slug: "photography", level: "INTERMEDIATE", years: 1 }],
  },
  {
    name: "Aditi Kulkarni", email: "aditi@example.com", avatar: "https://randomuser.me/api/portraits/women/79.jpg",
    bio: "Product manager turned coach. I teach PM thinking: discovery, prioritisation and shipping what matters.",
    headline: "Product Manager · PM & Speaking", location: "Pune, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi,Marathi", availability: AV("weekdays-mornings"), onlinePref: "ONLINE",
    verified: true, rating: 4.8, reviews: 35, completed: 29, hours: 36,
    teach: [{ slug: "product-management", level: "EXPERT", years: 8 }, { slug: "public-speaking", level: "ADVANCED", years: 6 }],
    learn: [{ slug: "sql", level: "INTERMEDIATE", years: 1 }],
  },
  {
    name: "Omar Haddad", email: "omar@example.com", avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    bio: "Full-stack developer in Nairobi. I build for the web and teach others to do the same.",
    headline: "Full-stack Developer · JavaScript", location: "Nairobi, Kenya", timezone: "Africa/Nairobi",
    languages: "English,Swahili", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: false, rating: 4.6, reviews: 15, completed: 13, hours: 16,
    teach: [{ slug: "javascript", level: "ADVANCED", years: 6 }, { slug: "web-development", level: "ADVANCED", years: 5 }],
    learn: [{ slug: "product-management", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Lena Fischer", email: "lena@example.com", avatar: "https://randomuser.me/api/portraits/women/83.jpg",
    bio: "German teacher from Berlin. Patient, structured, and a little funny — drei, zwei, eins, los!",
    headline: "German Teacher · A1–B2", location: "Berlin, Germany", timezone: "Europe/Berlin",
    languages: "English,German", availability: AV("weekdays-mornings"), onlinePref: "ONLINE",
    verified: true, rating: 5.0, reviews: 44, completed: 38, hours: 47,
    teach: [{ slug: "german", level: "EXPERT", years: 10 }, { slug: "english", level: "ADVANCED", years: 8 }],
    learn: [{ slug: "photography", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Sanjay Menon", email: "sanjay@example.com", avatar: "https://randomuser.me/api/portraits/men/62.jpg",
    bio: "Chess coach and tournament player. Openings, tactics and endgames — let's get your rating up.",
    headline: "Chess Coach · Strategy", location: "Kolkata, India", timezone: "Asia/Kolkata",
    languages: "English,Bengali,Hindi", availability: AV("weekends"), onlinePref: "BOTH",
    verified: false, rating: 4.7, reviews: 21, completed: 18, hours: 23,
    teach: [{ slug: "chess", level: "ADVANCED", years: 14 }],
    learn: [{ slug: "personal-finance", level: "INTERMEDIATE", years: 1 }],
  },
  {
    name: "Zara Ali", email: "zara@example.com", avatar: "https://randomuser.me/api/portraits/women/19.jpg",
    bio: "Two-time founder. I talk about startups the way they actually happen — messy, iterative, fun.",
    headline: "Founder · Entrepreneurship", location: "London, UK", timezone: "Europe/London",
    languages: "English,Urdu", availability: AV("weekdays-evenings"), onlinePref: "ONLINE",
    verified: true, rating: 4.8, reviews: 28, completed: 24, hours: 30,
    teach: [{ slug: "entrepreneurship", level: "ADVANCED", years: 9 }, { slug: "marketing", level: "ADVANCED", years: 7 }],
    learn: [{ slug: "piano", level: "BEGINNER", years: 0 }],
  },
  {
    name: "Nikhil Joshi", email: "nikhil@example.com", avatar: "https://randomuser.me/api/portraits/men/37.jpg",
    bio: "ML engineer. I make models work in production — and I can explain what a gradient is without making your eyes glaze over.",
    headline: "ML Engineer · Python & ML", location: "Bengaluru, India", timezone: "Asia/Kolkata",
    languages: "English,Hindi", availability: AV("every-day-evening"), onlinePref: "ONLINE",
    verified: true, rating: 4.9, reviews: 30, completed: 26, hours: 34,
    teach: [{ slug: "machine-learning", level: "EXPERT", years: 6 }, { slug: "python", level: "EXPERT", years: 7 }],
    learn: [{ slug: "public-speaking", level: "INTERMEDIATE", years: 1 }],
  },
];

function main(): void {
  applySchema();
  wipe();

  // ------------------------------------------------------------------ skills
  const skillIds: Record<string, string> = {};
  const skillRows: Skill[] = [];
  for (const s of SKILL_CATALOGUE) {
    const id = newId();
    run(
      `INSERT INTO skills (id, name, slug, category, description, icon, color, popularity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, s.name, s.name.toLowerCase().replace(/\s+/g, "-"), s.category, s.description, s.icon, s.color, s.popularity],
    );
    skillIds[s.name.toLowerCase().replace(/\s+/g, "-")] = id;
    skillRows.push({ id, name: s.name, slug: s.name.toLowerCase().replace(/\s+/g, "-"), category: s.category, description: s.description, icon: s.icon, color: s.color, popularity: s.popularity, createdAt: nowIso() });
  }
  console.log(`✓ ${skillRows.length} skills`);

  // ------------------------------------------------------------------- users
  const userIds: Record<string, string> = {};
  const userObjs: Record<string, User> = {};

  // Admin
  const admin = createUser({
    name: "SkillSwap Admin",
    email: "admin@skillswap.app",
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    role: "ADMIN",
    timezone: "Asia/Kolkata",
  });
  run("UPDATE users SET verified = 1, headline = 'Platform Admin', location = 'Bengaluru, India' WHERE id = ?", [admin.id]);
  userObjs[admin.id] = admin;
  userIds["admin"] = admin.id;

  const now = nowIso();
  for (const u of USERS) {
    const isDemo = u.email === "demo@skillswap.app";
    const password = isDemo ? DEMO_PASSWORD : SEED_PASSWORD;
    const user = createUser({
      name: u.name,
      email: u.email,
      passwordHash: bcrypt.hashSync(password, 10),
      image: u.avatar,
      timezone: u.timezone,
    });
    run(
      `UPDATE users SET bio = ?, headline = ?, location = ?, languages = ?, availability = ?, online_pref = ?,
              verified = ?, rating = ?, total_reviews = ?, completed_sessions = ?, hours_taught = ?, credits = ?,
              created_at = ?, updated_at = ?
       WHERE id = ?`,
      [u.bio, u.headline, u.location, u.languages, u.availability, u.onlinePref, u.verified ? 1 : 0, u.rating, u.reviews, u.completed, u.hours, 3, staggerCreatedAt(u.name), now, user.id],
    );
    userObjs[user.id] = { ...user, bio: u.bio, headline: u.headline, location: u.location, languages: u.languages, availability: u.availability, verified: u.verified, rating: u.rating, totalReviews: u.reviews, completedSessions: u.completed, hoursTaught: u.hours, credits: 3 };
    userIds[u.name] = user.id;

    // Welcome bonus — backdated to the account creation date so the wallet
    // chart reads oldest → newest.
    const createdAt = staggerCreatedAt(u.name);
    run(
      `INSERT INTO credit_transactions (id, user_id, amount, type, description, balance_after, created_at)
       VALUES (?, ?, ?, 'BONUS', ?, 3, ?)`,
      [newId(), user.id, STARTER_CREDITS, "Welcome to SkillSwap — 3 starter credits 🎉", createdAt],
    );

    for (const t of u.teach) {
      run(
        `INSERT INTO user_skills (id, user_id, skill_id, type, level, years_experience)
         VALUES (?, ?, ?, 'TEACH', ?, ?)`,
        [newId(), user.id, skillIds[t.slug], t.level, t.years],
      );
    }
    for (const l of u.learn) {
      run(
        `INSERT INTO user_skills (id, user_id, skill_id, type, level, years_experience)
         VALUES (?, ?, ?, 'LEARN', ?, ?)`,
        [newId(), user.id, skillIds[l.slug], l.level, l.years],
      );
    }
  }
  console.log(`✓ ${USERS.length + 1} users (incl. admin)`);

  // -------------------------------------------------------- credit history
  const demo = getUserByEmailOrThrow("demo@skillswap.app");
  const priya = getUserByEmailOrThrow("priya@example.com");
  const arjun = getUserByEmailOrThrow("arjun@example.com");
  const vikram = getUserByEmailOrThrow("vikram@example.com");
  const meera = getUserByEmailOrThrow("meera@example.com");
  const lakshmi = getUserByEmailOrThrow("lakshmi@example.com");
  const aarav = getUserByEmailOrThrow("aarav@example.com");

  // ---------------------------------------------------------------- matches
  // Demo's accepted swap with Priya (Python ↔ QGIS/Data Analytics)
  const demoSkills = skillsFor(demo.id);
  const priyaSkills = skillsFor(priya.id);
  const m1 = computeMatch(demo, priya, demoSkills, priyaSkills);
  const demopriya = swapPair(demo, priya);
  run(
    `INSERT INTO matches (id, user_a_id, user_b_id, compatibility_score, status, requested_skill_id, offered_skill_id, request_message, responded_at, created_at)
     VALUES (?, ?, ?, ?, 'ACCEPTED', ?, ?, ?, ?, ?)`,
    [newId(), demopriya.a, demopriya.b, m1.score, skillIds["python"], skillIds["qgis"], "Hi Priya! I'd love to learn Python from you. I can help you with QGIS and GIS workflows in return.", backdate("12d"), backdate("13d")],
  );

  const m2 = computeMatch(demo, aarav, demoSkills, skillsFor(aarav.id));
  const demoaarav = swapPair(demo, aarav);
  run(
    `INSERT INTO matches (id, user_a_id, user_b_id, compatibility_score, status, requested_skill_id, offered_skill_id, request_message, created_at)
     VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`,
    [newId(), demoaarav.a, demoaarav.b, m2.score, skillIds["ui-design"], skillIds["qgis"], "Hi Aarav! I'd love to learn UI design from you — I can teach QGIS in return.", backdate("1d")],
  );

  const m3 = computeMatch(vikram, demo, skillsFor(vikram.id), demoSkills);
  const vikramdemo = swapPair(vikram, demo);
  run(
    `INSERT INTO matches (id, user_a_id, user_b_id, compatibility_score, status, requested_skill_id, offered_skill_id, request_message, created_at)
     VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`,
    [newId(), vikramdemo.a, vikramdemo.b, m3.score, skillIds["qgis"], skillIds["english"], "Namaste Sumit — I'd love to level up my QGIS. I can help with your English in return.", backdate("2d")],
  );

  // A few community matches between other users
  const otherMatches: [User, User, string, string, string][] = [
    [nehaOr(), aarav, "figma", "javascript", "ACCEPTED"],
    [rohanOr(), ananyaOr(), "guitar", "react", "ACCEPTED"],
    [isabellaOr(), carlosOr(), "spanish", "ux-research", "ACCEPTED"],
    [davidOr(), nikhilOr(), "python", "stock-investing", "PENDING"],
    [sophiaOr(), rahulOr(), "marketing", "content-writing", "ACCEPTED"],
  ];
  for (const [a, b, req, offer, status] of otherMatches) {
    const res = computeMatch(a, b, skillsFor(a.id), skillsFor(b.id));
    const pair = swapPair(a, b);
    run(
      `INSERT INTO matches (id, user_a_id, user_b_id, compatibility_score, status, requested_skill_id, offered_skill_id, request_message, responded_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId(), pair.a, pair.b, res.score, status, skillIds[req], skillIds[offer], `Hi! I'd love to learn ${req.replace(/-/g, " ")} from you — happy to teach ${offer.replace(/-/g, " ")} in return.`, status === "PENDING" ? null : backdate("3d"), backdate("5d")],
    );
  }
  console.log("✓ matches (computed with the real matching engine)");

  // --------------------------------------------------------------- sessions
  const mkSession = (teacher: User, learner: User, skillSlug: string, startOffsetDays: number, hour: number, duration: number, status: string, opts: Partial<{ title: string; description: string; meetingUrl: string; cancelledBy: string; cancelReason: string }> = {}) => {
    const start = atDayTime(startOffsetDays, hour, teacher.timezone);
    run(
      `INSERT INTO sessions (id, teacher_id, learner_id, skill_id, title, description, start_time, end_time, duration, status, credits, session_type, meeting_url, cancelled_by, cancel_reason, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ONLINE', ?, ?, ?, ?, ?)`,
      [newId(), teacher.id, learner.id, skillIds[skillSlug], opts.title ?? null, opts.description ?? null, start, addMinutes(start, duration), duration, status, opts.meetingUrl ?? null, opts.cancelledBy ?? null, opts.cancelReason ?? null, backdate("14d"), now],
    );
  };

  // Demo teaches (completed → earns credits)
  mkSession(demo, meera, "qgis", -9, 19, 60, "COMPLETED", { title: "QGIS for beginners", meetingUrl: "https://meet.skillswap.app/room/qgis-basics" });
  mkSession(demo, vikram, "qgis", -5, 18, 60, "COMPLETED", { title: "Watershed digitisation in QGIS", meetingUrl: "https://meet.skillswap.app/room/watershed" });
  mkSession(demo, lakshmi, "remote-sensing", -2, 20, 60, "COMPLETED", { title: "Remote sensing fundamentals" });
  mkSession(demo, aarav, "ui-design", 3, 19, 60, "REQUESTED", { title: "UI design fundamentals", description: "First principles: hierarchy, spacing, typography." });
  // Demo learns
  mkSession(priya, demo, "data-analytics", -12, 19, 60, "COMPLETED", { title: "Pandas & analytics basics" });
  mkSession(priya, demo, "python", 2, 19, 60, "CONFIRMED", { title: "Python for GIS automation", meetingUrl: "https://meet.skillswap.app/room/python-gis" });
  mkSession(arjun, demo, "sql", 5, 20, 60, "CONFIRMED", { title: "SQL essentials", meetingUrl: "https://meet.skillswap.app/room/sql-essentials" });
  // Incoming request to demo
  mkSession(demo, rahulOr(), "qgis", 4, 17, 90, "REQUESTED", { title: "QGIS for field photography mapping" });
  // Community sessions
  mkSession(aarav, nehaOr(), "ui-design", -3, 19, 60, "COMPLETED", { title: "Design critique: portfolio review" });
  mkSession(aarav, nehaOr(), "figma", 6, 19, 60, "CONFIRMED", { title: "Figma components & auto-layout", meetingUrl: "https://meet.skillswap.app/room/figma-components" });
  mkSession(ananyaOr(), rohanOr(), "guitar", -4, 18, 60, "COMPLETED", { title: "First chords: 3 songs in 60 minutes" });
  mkSession(ananyaOr(), rohanOr(), "guitar", 7, 18, 60, "CONFIRMED", { title: "Fingerstyle fundamentals", meetingUrl: "https://meet.skillswap.app/room/fingerstyle" });
  mkSession(carlosOr(), isabellaOr(), "spanish", -6, 17, 60, "COMPLETED", { title: "Conversational Spanish, nivel 1" });
  mkSession(rohanOr(), meera, "react", 1, 20, 60, "CONFIRMED", { title: "React hooks in depth", meetingUrl: "https://meet.skillswap.app/room/react-hooks" });
  mkSession(nikhilOr(), davidOr(), "python", -1, 19, 60, "COMPLETED", { title: "Python for quant workflows" });
  mkSession(sophiaOr(), rahulOr(), "marketing", -7, 18, 60, "COMPLETED", { title: "Content strategy for photographers" });
  mkSession(zaraOr(), ananyaOr(), "piano", -8, 17, 60, "CANCELLED", { title: "Piano basics: chords & melody", cancelledBy: zaraOr().id, cancelReason: "Travel clash — rescheduling next month." });
  mkSession(jamesOr(), emilyOr(), "cooking", -10, 16, 60, "COMPLETED", { title: "Weeknight dal masterclass" });
  console.log("✓ sessions");

  // ------------------------------------------------------------ credit ledger
  const backdateTx = (userId: string, amount: number, type: string, description: string, daysAgo: number, sessionId: string | null = null) => {
    const bal = get<{ credits: number }>("SELECT credits FROM users WHERE id = ?", [userId]);
    const newBal = Number(bal!.credits) + amount;
    run("UPDATE users SET credits = ? WHERE id = ?", [newBal, userId]);
    run(
      `INSERT INTO credit_transactions (id, user_id, amount, type, description, balance_after, session_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId(), userId, amount, type, description, newBal, sessionId, backdate(`${daysAgo}d`)],
    );
  };
  const sessionIdFor = (teacherEmail: string, learnerEmail: string, titleLike: string) => {
    const t = getUserByEmailOrThrow(teacherEmail);
    const l = getUserByEmailOrThrow(learnerEmail);
    const r = get<{ id: string }>("SELECT id FROM sessions WHERE teacher_id = ? AND learner_id = ? AND title LIKE ? ORDER BY created_at DESC LIMIT 1", [t.id, l.id, `%${titleLike}%`]);
    return r?.id ?? null;
  };

  backdateTx(demo.id, -1, "SPENT", "Session: Data Analytics with Priya Patel", 12, sessionIdFor("priya@example.com", "demo@skillswap.app", "Pandas"));
  backdateTx(meera.id, -1, "SPENT", "Session: QGIS with Sumit Sharma", 9, sessionIdFor("demo@skillswap.app", "meera@example.com", "QGIS for beginners"));
  backdateTx(demo.id, 1, "EARNED", "Taught QGIS to Meera Krishnan", 9, sessionIdFor("demo@skillswap.app", "meera@example.com", "QGIS for beginners"));
  backdateTx(vikram.id, -1, "SPENT", "Session: QGIS with Sumit Sharma", 5, sessionIdFor("demo@skillswap.app", "vikram@example.com", "Watershed"));
  backdateTx(demo.id, 1, "EARNED", "Taught QGIS to Vikram Singh", 5, sessionIdFor("demo@skillswap.app", "vikram@example.com", "Watershed"));
  backdateTx(lakshmi.id, -1, "SPENT", "Session: Remote Sensing with Sumit Sharma", 2, sessionIdFor("demo@skillswap.app", "lakshmi@example.com", "Remote sensing"));
  backdateTx(demo.id, 1, "EARNED", "Taught Remote Sensing to Lakshmi Rao", 2, sessionIdFor("demo@skillswap.app", "lakshmi@example.com", "Remote sensing"));
  backdateTx(demo.id, -1, "SPENT", "Session: Python with Priya Patel", 0, sessionIdFor("priya@example.com", "demo@skillswap.app", "Python for GIS"));
  backdateTx(demo.id, -1, "SPENT", "Session: SQL with Arjun Nair", 0, sessionIdFor("arjun@example.com", "demo@skillswap.app", "SQL essentials"));
  backdateTx(nehaOr().id, -1, "SPENT", "Session: UI Design with Aarav Sharma", 3, sessionIdFor("aarav@example.com", "neha@example.com", "UI design"));
  backdateTx(aarav.id, 1, "EARNED", "Taught UI Design to Neha Gupta", 3, sessionIdFor("aarav@example.com", "neha@example.com", "UI design"));
  backdateTx(rohanOr().id, -1, "SPENT", "Session: Guitar with Ananya Iyer", 4, sessionIdFor("ananya@example.com", "rohan@example.com", "Guitar"));
  backdateTx(ananyaOr().id, 1, "EARNED", "Taught Guitar to Rohan Mehta", 4, sessionIdFor("ananya@example.com", "rohan@example.com", "Guitar"));
  backdateTx(zaraOr().id, -1, "SPENT", "Session: Piano with Ananya Iyer", 8, null);
  backdateTx(zaraOr().id, 1, "REFUND", "Refund: cancelled Piano session", 8, null);
  console.log("✓ credit ledger");

  // ---------------------------------------------------------------- reviews
  const mkReview = (skillSlug: string, reviewerEmail: string, reviewedEmail: string, rating: number, comment: string, tags: string[], daysAgo: number) => {
    const reviewer = getUserByEmailOrThrow(reviewerEmail);
    const reviewed = getUserByEmailOrThrow(reviewedEmail);
    const session = get<{ id: string }>(
      "SELECT s.id FROM sessions s JOIN skills sk ON sk.id = s.skill_id WHERE s.teacher_id IN (?, ?) AND s.learner_id IN (?, ?) AND sk.slug = ? AND s.status = 'COMPLETED' ORDER BY s.created_at DESC LIMIT 1",
      [reviewer.id, reviewed.id, reviewer.id, reviewed.id, skillSlug],
    );
    if (!session) return;
    run(
      `INSERT INTO reviews (id, session_id, reviewer_id, reviewed_id, rating, comment, tags, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId(), session.id, reviewer.id, reviewed.id, rating, comment, tags.join(","), backdate(`${daysAgo}d`)],
    );
  };
  mkReview("data-analytics", "demo@skillswap.app", "priya@example.com", 5, "Priya explains concepts so clearly — I finally understand joins and groupby. Highly recommend.", ["Helpful", "Clear explanation", "Knowledgeable"], 11);
  mkReview("qgis", "meera@example.com", "demo@skillswap.app", 5, "Sumit is a fantastic teacher. Patient, practical, and the session was perfectly paced.", ["Helpful", "Friendly", "Clear explanation"], 8);
  mkReview("qgis", "vikram@example.com", "demo@skillswap.app", 5, "Exactly the workflow I needed for field mapping. Sumit shared templates I use every week now.", ["Knowledgeable", "Prepared", "Helpful"], 4);
  mkReview("ui-design", "neha@example.com", "aarav@example.com", 5, "Aarav's critique opened my eyes. My portfolio looks dramatically better now.", ["Helpful", "Knowledgeable", "Punctual"], 2);
  mkReview("ui-design", "aarav@example.com", "neha@example.com", 5, "Neha is a quick learner with great instincts. Fun session!", ["Friendly", "Clear explanation"], 2);
  mkReview("guitar", "rohan@example.com", "ananya@example.com", 5, "Learned three chords and a full song in one session. Ananya is a natural teacher.", ["Helpful", "Patient", "Friendly"], 3);
  mkReview("guitar", "ananya@example.com", "rohan@example.com", 4, "Enthusiastic and prepared. Great student to teach.", ["Friendly", "Punctual"], 3);
  mkReview("spanish", "isabella@example.com", "carlos@example.com", 5, "Conversation-based and so effective. Carlos makes you forget you're 'studying'.", ["Helpful", "Clear explanation", "Friendly"], 5);
  mkReview("python", "david@example.com", "nikhil@example.com", 5, "Nikhil adapted the lesson to finance examples. Superb.", ["Knowledgeable", "Prepared"], 1);
  mkReview("cooking", "emily@example.com", "james@example.com", 5, "Made a proper masala dal! James is generous with his techniques.", ["Helpful", "Friendly"], 9);
  // recalc aggregate ratings to include these reviews
  for (const u of Object.values(userObjs)) {
    const agg = get<{ avg: number; n: number }>("SELECT AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE reviewed_id = ?", [u.id]);
    if (Number(agg?.n ?? 0) > 0) {
      run("UPDATE users SET rating = ?, total_reviews = ? WHERE id = ?", [Number(agg!.avg), Number(agg!.n), u.id]);
    }
  }
  console.log("✓ reviews");

  // ----------------------------------------------------------- conversations
  const mkConversation = (a: User, b: User, messages: { from: "a" | "b"; text: string; daysAgo: number; read?: boolean }[]) => {
    const [x, y] = a.id < b.id ? [a, b] : [b, a];
    const convId = newId();
    const created = backdate("14d");
    run("INSERT INTO conversations (id, user_a_id, user_b_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [convId, x.id, y.id, created, created]);
    for (const m of messages) {
      const sender = m.from === "a" ? a : b;
      const receiver = m.from === "a" ? b : a;
      const at = backdate(`${m.daysAgo}d`);
      run(
        `INSERT INTO messages (id, conversation_id, sender_id, content, read_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId(), convId, sender.id, m.text, m.read === false ? null : at, at],
      );
      run("UPDATE conversations SET last_message = ?, last_message_at = ?, updated_at = ? WHERE id = ?", [m.text, at, at, convId]);
    }
  };
  mkConversation(demo, priya, [
    { from: "a", text: "Hi Priya! I'm Sumit — I'd love to learn Python, specifically for automating GIS workflows. I can teach QGIS in return.", daysAgo: 12 },
    { from: "b", text: "That's a great swap! GIS + Python is a killer combo. Your QGIS help would be amazing for my mapping dashboards.", daysAgo: 12 },
    { from: "a", text: "Perfect — shall we do Tuesday 7 PM IST for our first session?", daysAgo: 11 },
    { from: "b", text: "Tuesday 7 PM works. I'll share the meet link before we start 📹", daysAgo: 11 },
    { from: "a", text: "Awesome, see you then!", daysAgo: 10 },
  ]);
  mkConversation(demo, aarav, [
    { from: "a", text: "Hi Aarav! I'd love to learn UI design from you. I can help you with QGIS and GIS workflows in return.", daysAgo: 1, read: false },
    { from: "b", text: "Hey Sumit, thanks for the message! I'm actually looking to map my user research data — QGIS would be perfect. I've sent you a session request for UI design.", daysAgo: 0, read: false },
  ]);
  mkConversation(demo, vikram, [
    { from: "b", text: "Sumit, your QGIS session was incredibly useful. The watershed workflow is working great — thank you!", daysAgo: 4 },
    { from: "a", text: "So glad to hear it! Ping me anytime if you get stuck on the symbology.", daysAgo: 4 },
  ]);
  mkConversation(nehaOr(), aarav, [
    { from: "a", text: "That critique was gold. Rebuilt the pricing page over the weekend!", daysAgo: 2 },
    { from: "b", text: "Send it over — I'd love to see the final version 😄", daysAgo: 1 },
  ]);
  console.log("✓ conversations & messages");

  // ---------------------------------------------------------- notifications
  const mkNotification = (user: User, type: string, title: string, message: string, link: string, daysAgo: number, read: boolean) => {
    run(
      `INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId(), user.id, type, title, message, link, read ? 1 : 0, backdate(`${daysAgo}d`)],
    );
  };
  mkNotification(demo, "REQUEST_ACCEPTED", "Swap request accepted 🎉", "Priya Patel accepted your request for Python. Start planning your session!", "/messages", 12, true);
  mkNotification(demo, "CREDIT", "+1 Skill Credit earned", "You taught QGIS to Vikram Singh.", "/wallet", 5, true);
  mkNotification(demo, "REVIEW", "You received a review ⭐", "Meera Krishnan rated your QGIS session 5/5.", "/users/sumit-sharma", 8, true);
  mkNotification(demo, "SESSION_REMINDER", "Session confirmed 🎉", "Priya Patel confirmed your Python session. 1 credit held.", "/sessions", 1, false);
  mkNotification(demo, "SWAP_REQUEST", "New swap request", "Rahul Verma wants to learn QGIS with you.", "/messages", 1, false);
  mkNotification(demo, "MESSAGE", "Aarav Sharma sent you a message", "Hey Sumit, thanks for the message! I'm actually looking to map my user research data…", "/messages", 0, false);
  mkNotification(priya, "SWAP_REQUEST", "New swap request", "Sumit Sharma wants to learn Python with you.", "/messages", 12, true);
  mkNotification(aarav, "MESSAGE", "Sumit Sharma sent you a message", "Hi Aarav! I'd love to learn UI design from you.", "/messages", 1, false);
  mkNotification(rohanOr(), "SESSION_REMINDER", "Session confirmed 🎉", "Ananya Iyer confirmed your Guitar session.", "/sessions", 3, true);
  console.log("✓ notifications");

  console.log("\n──────────────────────────────────────────────");
  console.log("SkillSwap seed complete ✅");
  console.log(`  Demo user   → demo@skillswap.app / ${DEMO_PASSWORD}`);
  console.log(`  Admin user  → admin@skillswap.app / ${ADMIN_PASSWORD}`);
  console.log(`  Other users → *@example.com / ${SEED_PASSWORD}`);
  console.log("──────────────────────────────────────────────");
}

// ------------------------------------------------------------------ helpers

function getUserByEmailOrThrow(email: string): User {
  const row = get("SELECT * FROM users WHERE email = ?", [email]);
  if (!row) throw new Error(`Seed user not found: ${email}`);
  return row as unknown as User;
}

function skillsFor(userId: string) {
  const rows = getSkillsForUsers([userId]);
  const list = rows[userId] ?? [];
  return {
    teach: list.filter((s) => s.type === "TEACH"),
    learn: list.filter((s) => s.type === "LEARN"),
  };
}

function swapPair(a: User, b: User): { a: string; b: string } {
  return a.id < b.id ? { a: a.id, b: b.id } : { a: b.id, b: a.id };
}

function staggerCreatedAt(name: string): string {
  const names = USERS.map((u) => u.name);
  const idx = Math.max(0, names.indexOf(name));
  const d = new Date();
  d.setDate(d.getDate() - (90 - idx * 3));
  return d.toISOString();
}

function backdate(spec: string): string {
  const days = Number.parseInt(spec, 10);
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString();
}

/** A reference date at `hour` local time in `tz`, offset by days. */
function atDayTime(days: number, hour: number, tz: string): string {
  const d = new Date(Date.now() + days * 86400000);
  d.setHours(hour, 0, 0, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"))).toISOString();
}

// Small helpers to reference seeded users by name
function nehaOr(): User { return getUserByEmailOrThrow("neha@example.com"); }
function rohanOr(): User { return getUserByEmailOrThrow("rohan@example.com"); }
function ananyaOr(): User { return getUserByEmailOrThrow("ananya@example.com"); }
function isabellaOr(): User { return getUserByEmailOrThrow("isabella@example.com"); }
function carlosOr(): User { return getUserByEmailOrThrow("carlos@example.com"); }
function davidOr(): User { return getUserByEmailOrThrow("david@example.com"); }
function nikhilOr(): User { return getUserByEmailOrThrow("nikhil@example.com"); }
function sophiaOr(): User { return getUserByEmailOrThrow("sophia@example.com"); }
function rahulOr(): User { return getUserByEmailOrThrow("rahul@example.com"); }
function zaraOr(): User { return getUserByEmailOrThrow("zara@example.com"); }
function jamesOr(): User { return getUserByEmailOrThrow("james@example.com"); }
function emilyOr(): User { return getUserByEmailOrThrow("emily@example.com"); }

main();
