import { z } from "zod";

// Users table schema
export const insertUserSchema = z.object({
  username: z.string().min(1),
  displayName: z.string().min(1),
  preferredLanguage: z.enum(["en", "ru"]).default("en"),
  preferredScript: z.enum(["latin", "cyrillic"]).default("latin"),
  password: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

export type RegisterUser = z.infer<typeof registerUserSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export interface User {
  id: string;
  username: string;
  displayName: string;
  preferredLanguage: string;
  preferredScript: string;
  role: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  createdAt: string;
  /** Only present server-side; stripped before sending to client */
  password?: string;
}

// Words table schema
export const insertWordSchema = z.object({
  latinPamiri: z.string().min(1),
  cyrillicPamiri: z.string().default(""),
  english: z.string().min(1),
  russian: z.string().min(1),
  category: z.string().min(1),
  source: z.enum(["manual", "zarubin", "community"]).default("community"),
  addedByUserId: z.string().nullable().default(null),
});

export type InsertWord = z.infer<typeof insertWordSchema>;

export interface Word {
  id: number;
  latinPamiri: string;
  cyrillicPamiri: string;
  english: string;
  russian: string;
  category: string;
  source: string;
  addedByUserId: string | null;
  verified: boolean;
  upvotesCount: number;
  createdAt: string;
}

// UserProgress schema
export const insertProgressSchema = z.object({
  userId: z.string(),
  wordId: z.number(),
});

export type InsertProgress = z.infer<typeof insertProgressSchema>;

export interface UserProgress {
  id: number;
  userId: string;
  wordId: number;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: number;
  lastReviewedAt: string | null;
}

// WordVotes schema
export const insertVoteSchema = z.object({
  wordId: z.number(),
  userId: z.string(),
  voteType: z.enum(["up", "down"]),
});

export type InsertVote = z.infer<typeof insertVoteSchema>;

export interface WordVote {
  id: number;
  wordId: number;
  userId: string;
  voteType: string;
  createdAt: string;
}

// XP Log schema
export const insertXpLogSchema = z.object({
  userId: z.string(),
  actionType: z.string(),
  xpEarned: z.number(),
  details: z.string().default(""),
});

export type InsertXpLog = z.infer<typeof insertXpLogSchema>;

export interface XpLog {
  id: number;
  userId: string;
  actionType: string;
  xpEarned: number;
  details: string;
  createdAt: string;
}

// Badges schema
export const insertBadgeSchema = z.object({
  userId: z.string(),
  badgeType: z.string(),
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export interface Badge {
  id: number;
  userId: string;
  badgeType: string;
  earnedAt: string;
}

// News schema
export const insertNewsSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  authorId: z.string(),
});

export type InsertNews = z.infer<typeof insertNewsSchema>;

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

// Community review type (Word + vote metadata)
export interface PendingWordReview extends Word {
  userVote: string | null;  // 'up' | 'down' | null
  upVotes: number;
  downVotes: number;
}

// Word Suggestions schema (corrections submitted by users)
export const insertSuggestionSchema = z.object({
  wordId: z.number(),
  userId: z.string(),
  latinPamiri: z.string().min(1),
  cyrillicPamiri: z.string().default(""),
  english: z.string().min(1),
  russian: z.string().min(1),
});

export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;

export interface WordSuggestion {
  id: number;
  wordId: number;
  userId: string;
  latinPamiri: string;
  cyrillicPamiri: string;
  english: string;
  russian: string;
  upvotesCount: number;
  status: string; // 'pending' | 'approved' | 'rejected'
  createdAt: string;
}

// Suggestion Votes schema
export const insertSuggestionVoteSchema = z.object({
  suggestionId: z.number(),
  userId: z.string(),
  voteType: z.enum(["up", "down"]),
});

export type InsertSuggestionVote = z.infer<typeof insertSuggestionVoteSchema>;

export interface SuggestionVote {
  id: number;
  suggestionId: number;
  userId: string;
  voteType: string;
  createdAt: string;
}

// Quiz types
export interface QuizQuestion {
  wordId: number;
  questionType: "multiple_choice" | "match";
  prompt: string;
  correctAnswer: string;
  options: string[];
}

// Category unlock levels
// Number of net upvotes required for a word to be considered "ready for approval"
export const APPROVAL_THRESHOLD = 5;

export const CATEGORY_UNLOCKS: Record<string, { level: number; xpRequired: number }> = {
  "Greetings and Basics": { level: 1, xpRequired: 0 },
  "Numbers and Quantities": { level: 2, xpRequired: 200 },
  "Pronouns and Particles": { level: 3, xpRequired: 400 },
  "Family and Kinship": { level: 4, xpRequired: 600 },
  "The Human Body": { level: 5, xpRequired: 800 },
  "Adjectives and Qualities": { level: 6, xpRequired: 1000 },
  "Verbs and Actions": { level: 7, xpRequired: 1200 },
  "Food and Drink": { level: 8, xpRequired: 1500 },
  "Nature and Landscape": { level: 9, xpRequired: 1800 },
  "House and Home": { level: 10, xpRequired: 2100 },
  "Time and Seasons": { level: 11, xpRequired: 2400 },
  "Agriculture and Livestock": { level: 12, xpRequired: 2800 },
  "Animals and Birds": { level: 12, xpRequired: 2800 },
  "Household Objects and Tools": { level: 13, xpRequired: 3200 },
  "Clothing and Appearance": { level: 13, xpRequired: 3200 },
  "Social Life and Ceremonies": { level: 14, xpRequired: 3600 },
  "Trade and Money": { level: 14, xpRequired: 3600 },
  "Emotions and Mental States": { level: 15, xpRequired: 4000 },
  "Health and Illness": { level: 15, xpRequired: 4000 },
  "Speech and Communication": { level: 16, xpRequired: 4500 },
  "Movement and Travel": { level: 16, xpRequired: 4500 },
  "War and Conflict": { level: 17, xpRequired: 5000 },
  "Descriptive and Abstract": { level: 17, xpRequired: 5000 },
};

// Russian translations for category names
export const CATEGORY_RU: Record<string, string> = {
  "Greetings and Basics": "Приветствия и основы",
  "Numbers and Quantities": "Числа и количества",
  "Pronouns and Particles": "Местоимения и частицы",
  "Family and Kinship": "Семья и родство",
  "The Human Body": "Тело человека",
  "Adjectives and Qualities": "Прилагательные и качества",
  "Verbs and Actions": "Глаголы и действия",
  "Food and Drink": "Еда и напитки",
  "Nature and Landscape": "Природа и ландшафт",
  "House and Home": "Дом и жильё",
  "Time and Seasons": "Время и сезоны",
  "Agriculture and Livestock": "Сельское хозяйство",
  "Animals and Birds": "Животные и птицы",
  "Household Objects and Tools": "Предметы быта и инструменты",
  "Clothing and Appearance": "Одежда и внешность",
  "Social Life and Ceremonies": "Общество и обряды",
  "Trade and Money": "Торговля и деньги",
  "Emotions and Mental States": "Эмоции и состояния",
  "Health and Illness": "Здоровье и болезни",
  "Speech and Communication": "Речь и общение",
  "Movement and Travel": "Движение и путешествия",
  "War and Conflict": "Война и конфликты",
  "Descriptive and Abstract": "Описание и абстракции",
};

export function getLevelFromXp(xp: number): number {
  if (xp >= 5000) return 17;
  if (xp >= 4500) return 16;
  if (xp >= 4000) return 15;
  if (xp >= 3600) return 14;
  if (xp >= 3200) return 13;
  if (xp >= 2800) return 12;
  if (xp >= 2400) return 11;
  if (xp >= 2100) return 10;
  if (xp >= 1800) return 9;
  if (xp >= 1500) return 8;
  if (xp >= 1200) return 7;
  if (xp >= 1000) return 6;
  if (xp >= 800) return 5;
  if (xp >= 600) return 4;
  if (xp >= 400) return 3;
  if (xp >= 200) return 2;
  return 1;
}

export function getXpForLevel(level: number): number {
  const thresholds: Record<number, number> = {
    1: 0, 2: 200, 3: 400, 4: 600, 5: 800, 6: 1000,
    7: 1200, 8: 1500, 9: 1800, 10: 2100, 11: 2400,
    12: 2800, 13: 3200, 14: 3600, 15: 4000, 16: 4500, 17: 5000,
  };
  return thresholds[level] || 0;
}

export function getXpForNextLevel(level: number): number {
  if (level >= 17) return 5000;
  return getXpForLevel(level + 1);
}
