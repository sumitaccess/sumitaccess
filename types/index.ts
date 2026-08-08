// ============================================================================
// SkillSwap — shared domain types (mirror of DB rows in camelCase)
// ============================================================================

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string | null;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  image: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  timezone: string;
  languages: string;
  availability: string | null;
  onlinePref: string;
  credits: number;
  rating: number;
  totalReviews: number;
  completedSessions: number;
  hoursTaught: number;
  role: string;
  status: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
}

export type SafeUser = Omit<User, "email" | "passwordHash" | "resetToken" | "resetTokenExpiry"> & { email?: string };

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  popularity: number;
  createdAt: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  type: "TEACH" | "LEARN";
  level: string;
  yearsExperience: number;
  description: string | null;
  skill?: Skill;
}

export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  compatibilityScore: number;
  status: string;
  requestedSkillId: string | null;
  offeredSkillId: string | null;
  requestMessage: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  teacherId: string;
  learnerId: string;
  skillId: string;
  title: string | null;
  description: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  credits: number;
  sessionType: string;
  meetingUrl: string | null;
  location: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userAId: string;
  userBId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachment: string | null;
  attachmentType: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  sessionId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment: string | null;
  tags: string | null;
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  sessionId: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  sessionId: string | null;
  type: string;
  reason: string;
  details: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Composed / presentation types
// ---------------------------------------------------------------------------

export interface PersonCard {
  user: SafeUser;
  teach: (UserSkill & { skill: Skill })[];
  learn: (UserSkill & { skill: Skill })[];
  matchScore: number;
  matchReasons: string[];
  matchStatus?: string; // existing match status between viewer and user
  existingMatchId?: string;
  mutualCount: number;
}

export interface ConversationWithUser extends Conversation {
  otherUser: SafeUser;
  unreadCount: number;
}

export interface SessionWithDetails extends Session {
  teacher: SafeUser;
  learner: SafeUser;
  skill: Skill;
  review?: Review | null;
}

export interface WalletSummary {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: CreditTransaction[];
  history: { date: string; balance: number }[];
}
