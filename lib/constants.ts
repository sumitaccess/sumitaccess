// ============================================================================
// SkillSwap — domain constants. Enum-like values validated with Zod.
// ============================================================================

export const CATEGORIES = [
  { key: "TECHNOLOGY", label: "Technology", icon: "Code2" },
  { key: "DESIGN", label: "Design", icon: "Palette" },
  { key: "BUSINESS", label: "Business", icon: "Briefcase" },
  { key: "LANGUAGES", label: "Languages", icon: "Languages" },
  { key: "MUSIC", label: "Music", icon: "Music" },
  { key: "FITNESS", label: "Fitness", icon: "Dumbbell" },
  { key: "PHOTOGRAPHY", label: "Photography", icon: "Camera" },
  { key: "GIS", label: "GIS & Mapping", icon: "Map" },
  { key: "FINANCE", label: "Finance", icon: "LineChart" },
  { key: "MARKETING", label: "Marketing", icon: "Megaphone" },
  { key: "LIFESTYLE", label: "Lifestyle", icon: "Coffee" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label])) as Record<string, string>;

export const CATEGORY_ICON = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.icon])) as Record<string, string>;

export const SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const SKILL_LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

export const USER_SKILL_TYPES = ["TEACH", "LEARN"] as const;
export type UserSkillType = (typeof USER_SKILL_TYPES)[number];

export const MATCH_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "BLOCKED"] as const;

export const SESSION_STATUSES = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "DISPUTED"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Pending",
  CONFIRMED: "Upcoming",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

export const SESSION_TYPES = ["ONLINE", "IN_PERSON"] as const;

export const CREDIT_TX_TYPES = ["EARNED", "SPENT", "BONUS", "REFUND", "ADMIN_ADJUSTMENT"] as const;

export const NOTIFICATION_TYPES = [
  "MATCH",
  "SWAP_REQUEST",
  "REQUEST_ACCEPTED",
  "MESSAGE",
  "SESSION_REMINDER",
  "SESSION_COMPLETED",
  "REVIEW",
  "CREDIT",
  "SYSTEM",
] as const;

export const USER_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export const USER_STATUSES = ["ACTIVE", "SUSPENDED"] as const;

export const ONLINE_PREFS = ["ONLINE", "IN_PERSON", "BOTH"] as const;

export const STARTER_CREDITS = 3;

export const REVIEW_TAGS = [
  "Helpful",
  "Friendly",
  "Knowledgeable",
  "Punctual",
  "Clear explanation",
  "Patient",
  "Great communicator",
  "Prepared",
] as const;

export const REPORT_REASONS = [
  "Inappropriate behaviour",
  "Harassment",
  "No-show for a session",
  "Scam or suspicious activity",
  "Spam",
  "Offensive content",
  "Other",
] as const;

export const AVAILABILITY_PRESETS = [
  { key: "weekdays-evenings", label: "Weekdays, 6–10 PM", value: { mon: ["18:00-22:00"], tue: ["18:00-22:00"], wed: ["18:00-22:00"], thu: ["18:00-22:00"], fri: ["18:00-22:00"] } },
  { key: "weekdays-mornings", label: "Weekdays, 8–11 AM", value: { mon: ["08:00-11:00"], tue: ["08:00-11:00"], wed: ["08:00-11:00"], thu: ["08:00-11:00"], fri: ["08:00-11:00"] } },
  { key: "weekends", label: "Weekends, all day", value: { sat: ["09:00-20:00"], sun: ["09:00-20:00"] } },
  { key: "every-day-evening", label: "Every day, 7–10 PM", value: { mon: ["19:00-22:00"], tue: ["19:00-22:00"], wed: ["19:00-22:00"], thu: ["19:00-22:00"], fri: ["19:00-22:00"], sat: ["19:00-22:00"], sun: ["19:00-22:00"] } },
  { key: "flexible", label: "I'm flexible", value: { mon: ["09:00-21:00"], tue: ["09:00-21:00"], wed: ["09:00-21:00"], thu: ["09:00-21:00"], fri: ["09:00-21:00"], sat: ["10:00-20:00"], sun: ["10:00-20:00"] } },
] as const;

export const DAY_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const DAY_LABEL: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Toronto",
  "Australia/Sydney",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Sao_Paulo",
] as const;

export const CITIES = [
  "Delhi, India",
  "Mumbai, India",
  "Bengaluru, India",
  "Hyderabad, India",
  "Pune, India",
  "Chennai, India",
  "Kolkata, India",
  "Jaipur, India",
  "Singapore",
  "Dubai, UAE",
  "London, UK",
  "Berlin, Germany",
  "New York, USA",
  "San Francisco, USA",
  "Toronto, Canada",
  "Sydney, Australia",
  "Lagos, Nigeria",
  "Nairobi, Kenya",
] as const;

// ---------------------------------------------------------------------------
// Seed skill catalogue
// ---------------------------------------------------------------------------

export interface SeedSkill {
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  popularity: number;
}

export const SKILL_CATALOGUE: SeedSkill[] = [
  // Technology
  { name: "Python", category: "TECHNOLOGY", description: "General-purpose programming — data, automation, web and AI.", icon: "Terminal", color: "bg-sky-500", popularity: 98 },
  { name: "JavaScript", category: "TECHNOLOGY", description: "The language of the web — frontend, backend and everything in between.", icon: "Code2", color: "bg-yellow-500", popularity: 96 },
  { name: "React", category: "TECHNOLOGY", description: "Build modern, component-based user interfaces.", icon: "Atom", color: "bg-cyan-500", popularity: 94 },
  { name: "TypeScript", category: "TECHNOLOGY", description: "Typed JavaScript for safer, more scalable apps.", icon: "Braces", color: "bg-blue-500", popularity: 90 },
  { name: "SQL", category: "TECHNOLOGY", description: "Query and design relational databases with confidence.", icon: "Database", color: "bg-indigo-500", popularity: 88 },
  { name: "Java", category: "TECHNOLOGY", description: "Enterprise-grade, platform-independent programming.", icon: "Coffee", color: "bg-orange-600", popularity: 78 },
  { name: "Data Analytics", category: "TECHNOLOGY", description: "Turn raw data into decisions — Excel, SQL, Python and dashboards.", icon: "BarChart3", color: "bg-emerald-500", popularity: 86 },
  { name: "Machine Learning", category: "TECHNOLOGY", description: "Train models, understand the fundamentals and ship ML features.", icon: "BrainCircuit", color: "bg-violet-500", popularity: 92 },
  { name: "Web Development", category: "TECHNOLOGY", description: "HTML, CSS and the craft of building for the browser.", icon: "Globe", color: "bg-teal-500", popularity: 95 },
  // Design
  { name: "Figma", category: "DESIGN", description: "Product design and prototyping in Figma.", icon: "Frame", color: "bg-pink-500", popularity: 93 },
  { name: "UI Design", category: "DESIGN", description: "Interfaces that are beautiful, usable and consistent.", icon: "LayoutGrid", color: "bg-rose-500", popularity: 91 },
  { name: "UX Research", category: "DESIGN", description: "Understand users through interviews, testing and insight.", icon: "SearchCheck", color: "bg-fuchsia-500", popularity: 82 },
  { name: "Video Editing", category: "DESIGN", description: "Cut, pace and polish video content like a pro.", icon: "Clapperboard", color: "bg-red-500", popularity: 84 },
  { name: "Photoshop", category: "DESIGN", description: "Retouching, compositing and digital art in Photoshop.", icon: "Image", color: "bg-blue-600", popularity: 80 },
  // Business
  { name: "Marketing", category: "BUSINESS", description: "Position, promote and grow products people love.", icon: "Megaphone", color: "bg-amber-500", popularity: 87 },
  { name: "Sales", category: "BUSINESS", description: "Consultative selling and pipeline discipline.", icon: "TrendingUp", color: "bg-lime-500", popularity: 76 },
  { name: "Entrepreneurship", category: "BUSINESS", description: "From idea to launch — strategy, validation and execution.", icon: "Rocket", color: "bg-purple-500", popularity: 85 },
  { name: "Public Speaking", category: "BUSINESS", description: "Speak clearly, confidently and persuasively.", icon: "Mic", color: "bg-indigo-400", popularity: 74 },
  { name: "Product Management", category: "BUSINESS", description: "Discovery, prioritisation and shipping what matters.", icon: "Target", color: "bg-cyan-600", popularity: 83 },
  // Languages
  { name: "English", category: "LANGUAGES", description: "Conversational and professional English practice.", icon: "MessageSquareText", color: "bg-sky-600", popularity: 97 },
  { name: "Hindi", category: "LANGUAGES", description: "Speak, read and write Hindi with confidence.", icon: "BookOpen", color: "bg-orange-500", popularity: 89 },
  { name: "Spanish", category: "LANGUAGES", description: "One of the world's most spoken languages.", icon: "Languages", color: "bg-red-400", popularity: 88 },
  { name: "French", category: "LANGUAGES", description: "The language of art, cuisine and diplomacy.", icon: "Languages", color: "bg-blue-500", popularity: 81 },
  { name: "German", category: "LANGUAGES", description: "From A1 basics to confident conversation.", icon: "Languages", color: "bg-yellow-600", popularity: 70 },
  // Music
  { name: "Guitar", category: "MUSIC", description: "Chords, strumming, fingerstyle and theory.", icon: "Guitar", color: "bg-amber-600", popularity: 79 },
  { name: "Piano", category: "MUSIC", description: "Keys, chords and playing songs you love.", icon: "Piano", color: "bg-stone-500", popularity: 77 },
  { name: "Singing", category: "MUSIC", description: "Vocal technique, pitch and performance.", icon: "MicVocal", color: "bg-pink-600", popularity: 72 },
  // Fitness
  { name: "Yoga", category: "FITNESS", description: "Strength, flexibility and calm — guided practice.", icon: "Flower2", color: "bg-green-500", popularity: 82 },
  { name: "Strength Training", category: "FITNESS", description: "Build muscle with safe, progressive programming.", icon: "Dumbbell", color: "bg-zinc-500", popularity: 75 },
  { name: "Running", category: "FITNESS", description: "From couch to 5K and beyond.", icon: "Footprints", color: "bg-red-500", popularity: 68 },
  // Photography
  { name: "Photography", category: "PHOTOGRAPHY", description: "Composition, light and editing fundamentals.", icon: "Camera", color: "bg-stone-600", popularity: 78 },
  { name: "Mobile Photography", category: "PHOTOGRAPHY", description: "Stunning photos with the camera in your pocket.", icon: "Smartphone", color: "bg-slate-500", popularity: 71 },
  // GIS
  { name: "QGIS", category: "GIS", description: "Open-source GIS — mapping, analysis and cartography.", icon: "Map", color: "bg-green-700", popularity: 73 },
  { name: "ArcGIS", category: "GIS", description: "Professional GIS workflows in the ArcGIS ecosystem.", icon: "Globe2", color: "bg-teal-700", popularity: 66 },
  { name: "Remote Sensing", category: "GIS", description: "Satellite imagery and spatial analysis.", icon: "Satellite", color: "bg-sky-700", popularity: 64 },
  { name: "Cartography", category: "GIS", description: "The art and science of beautiful maps.", icon: "MapPinned", color: "bg-emerald-700", popularity: 60 },
  // Finance
  { name: "Personal Finance", category: "FINANCE", description: "Budgeting, saving and investing basics.", icon: "Wallet", color: "bg-emerald-500", popularity: 86 },
  { name: "Stock Investing", category: "FINANCE", description: "Markets, fundamentals and long-term investing.", icon: "LineChart", color: "bg-green-600", popularity: 80 },
  { name: "Financial Modeling", category: "FINANCE", description: "Spreadsheet modeling for business decisions.", icon: "Table2", color: "bg-lime-600", popularity: 69 },
  // Marketing
  { name: "SEO", category: "MARKETING", description: "Rank higher — technical and content SEO.", icon: "Search", color: "bg-blue-400", popularity: 79 },
  { name: "Social Media Marketing", category: "MARKETING", description: "Grow audiences on Instagram, LinkedIn and more.", icon: "Share2", color: "bg-pink-400", popularity: 85 },
  { name: "Content Writing", category: "MARKETING", description: "Words that engage, inform and convert.", icon: "PenLine", color: "bg-violet-400", popularity: 81 },
  // Lifestyle
  { name: "Cooking", category: "LIFESTYLE", description: "From dal to dumplings — everyday cooking skills.", icon: "ChefHat", color: "bg-orange-400", popularity: 83 },
  { name: "Meditation", category: "LIFESTYLE", description: "Build a sustainable daily practice.", icon: "Sparkles", color: "bg-indigo-300", popularity: 70 },
  { name: "Chess", category: "LIFESTYLE", description: "Strategy, tactics and opening principles.", icon: "ChessKnight", color: "bg-stone-400", popularity: 66 },
];
