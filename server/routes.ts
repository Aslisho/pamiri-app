import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { randomBytes, scryptSync } from "crypto";
import {
  insertWordSchema, insertVoteSchema, insertNewsSchema,
  insertSuggestionSchema, insertSuggestionVoteSchema,
  registerUserSchema, loginSchema,
  CATEGORY_UNLOCKS, getLevelFromXp, getXpForNextLevel,
  type QuizQuestion, type Word, type User,
} from "@shared/schema";

/** Strip password hash before sending user to client */
function safeUser(u: User): Omit<User, "password"> {
  const { password: _pw, ...rest } = u;
  return rest;
}

// ─── Session type augmentation ───────────────────────────────────────────────
declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

// ─── Auth middleware ─────────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }
  next();
}

function requireModerator(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId || req.session.role !== "moderator") {
    return res.status(403).json({ error: "Доступ запрещён" });
  }
  next();
}

// ─── Rate limiters ───────────────────────────────────────────────────────────
const voteRateMap = new Map<string, number[]>();
const VOTE_RATE_LIMIT = 30;
const VOTE_RATE_WINDOW = 60_000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (voteRateMap.get(userId) || []).filter(t => now - t < VOTE_RATE_WINDOW);
  if (timestamps.length >= VOTE_RATE_LIMIT) return true;
  timestamps.push(now);
  voteRateMap.set(userId, timestamps);
  return false;
}

// Login rate limiter: 10 attempts per IP per minute
const loginRateMap = new Map<string, number[]>();
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW = 60_000;

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (loginRateMap.get(ip) || []).filter(t => now - t < LOGIN_RATE_WINDOW);
  if (timestamps.length >= LOGIN_RATE_LIMIT) return true;
  timestamps.push(now);
  loginRateMap.set(ip, timestamps);
  return false;
}

const AUTO_APPROVE_THRESHOLD = 5;

// ─── Password helpers ────────────────────────────────────────────────────────
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = scryptSync(password, salt, 64).toString("hex");
  return hash === attempt;
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth - Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerUserSchema.parse(req.body);

      const existing = await storage.getUserByUsername(parsed.username.trim());

      if (existing) {
        // Allow legacy users (no password) to claim their account
        const existingHash = await storage.getPasswordHash(existing.id);
        if (existingHash) {
          return res.status(409).json({ error: "Имя пользователя уже занято" });
        }
        const passwordHash = await bcrypt.hash(parsed.password, 10);
        await storage.setPasswordHash(existing.id, passwordHash);
        req.session.userId = existing.id;
        req.session.role = existing.role;
        return res.json(existing);
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);

      const user = await storage.createUser(
        {
          username: parsed.username.trim(),
          displayName: parsed.displayName.trim(),
          preferredLanguage: parsed.preferredLanguage || "ru",
          preferredScript: parsed.preferredScript || "latin",
        },
        passwordHash
      );

      req.session.userId = user.id;
      req.session.role = user.role;
      return res.json(user);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ error: e.errors[0]?.message || "Ошибка валидации" });
      }
      return res.status(500).json({ error: e.message });
    }
  });

  // Auth - Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(parsed.username.trim());
      if (!user) {
        return res.status(401).json({ error: "Неверное имя пользователя или пароль" });
      }

      const storedHash = await storage.getPasswordHash(user.id);
      if (!storedHash) {
        return res.status(401).json({ error: "Неверное имя пользователя или пароль" });
      }

      const valid = await bcrypt.compare(parsed.password, storedHash);
      if (!valid) {
        return res.status(401).json({ error: "Неверное имя пользователя или пароль" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      return res.json(user);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ error: "Имя пользователя и пароль обязательны" });
      }
      return res.status(500).json({ error: e.message });
    }
  });

  // Restore session on page reload
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    return res.json(user);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  // ===== USER ENDPOINTS =====

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  });

  app.get("/api/users/:id/stats", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const badges = await storage.getBadgesForUser(user.id);
    const progress = await storage.getUserProgress(user.id);
    const wordsLearned = progress.filter(p => p.masteryLevel >= 1).length;
    const allWords = await storage.getAllVerifiedWords();
    const communityWords = allWords.filter(w => w.addedByUserId === user.id);
    const leaderboard = await storage.getLeaderboard();
    const rank = leaderboard.findIndex(u => u.id === user.id) + 1;

    return res.json({
      ...user,
      badges,
      wordsLearned,
      wordsContributed: communityWords.length,
      globalRank: rank || leaderboard.length + 1,
    });
  });

  // Update preferences (authenticated)
  app.put("/api/users/preferences", requireAuth, async (req, res) => {
    const { preferredLanguage, preferredScript } = req.body;
    const user = await storage.updateUserPreferences(
      req.session.userId!,
      preferredLanguage,
      preferredScript,
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  });

  app.get("/api/leaderboard", async (_req, res) => {
    const users = await storage.getLeaderboard();
    return res.json(users);
  });

  // ===== WORDS =====

  app.get("/api/words", async (req, res) => {
    const category = req.query.category as string | undefined;
    if (category) {
      const words = await storage.getWordsByCategory(category);
      return res.json(words);
    }
    const words = await storage.getAllVerifiedWords();
    return res.json(words);
  });

  app.get("/api/words/unlocked/:userId", async (req, res) => {
    const words = await storage.getUnlockedWordsForUser(req.params.userId);
    return res.json(words);
  });

  app.get("/api/words/categories/:userId", async (req, res) => {
    const cats = await storage.getCategoriesWithUnlockInfo(req.params.userId);
    return res.json(cats);
  });

  // Submit a word (authenticated — userId from session)
  app.post("/api/words", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parsed = insertWordSchema.parse({
        ...req.body,
        source: "community",
        addedByUserId: userId,
      });
      const word = await storage.createWord(parsed);

      // Award 50 XP for contributing
      await storage.updateUserXp(userId, 50);
      await storage.createXpLog({
        userId,
        actionType: "word_contribution",
        xpEarned: 50,
        details: `Contributed word: ${parsed.latinPamiri}`,
      });
      await storage.updateUserStreak(userId);
      // Check word warrior badge
      const allWords = await storage.getAllVerifiedWords();
      const unverified = await storage.getUnverifiedWords();
      const userWords = [...allWords, ...unverified].filter(w => w.addedByUserId === userId);
      if (userWords.length >= 10 && !(await storage.hasBadge(userId, "word_warrior"))) {
        await storage.createBadge({ userId, badgeType: "word_warrior" });
      }

      return res.json(word);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/words/pending", async (_req, res) => {
    const words = await storage.getUnverifiedWords();
    return res.json(words);
  });

  // Community review queue (authenticated — userId from session)
  app.get("/api/words/pending-review", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const includeVoted = req.query.includeVoted === "true";
    const words = await storage.getPendingCommunityWords(userId, includeVoted);
    return res.json(words);
  });

  // Mod-only: approve/reject words
  app.post("/api/words/:id/approve", requireModerator, async (req, res) => {
    const word = await storage.approveWord(Number(req.params.id));
    if (!word) return res.status(404).json({ error: "Word not found" });
    return res.json(word);
  });

  app.post("/api/words/:id/reject", requireModerator, async (req, res) => {
    const deleted = await storage.rejectWord(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Word not found" });
    return res.json({ success: true });
  });

  // Vote on a word (authenticated — userId from session)
  app.post("/api/words/:id/vote", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parsed = insertVoteSchema.parse({
        wordId: Number(req.params.id),
        userId,
        voteType: req.body.voteType,
      });

      if (isRateLimited(userId)) {
        return res.status(429).json({ error: "Too many votes. Please slow down." });
      }

      const wordBefore = await storage.getWordById(parsed.wordId);
      const isUnverifiedReview = wordBefore && !wordBefore.verified;

      const existingVotes = isUnverifiedReview
        ? await storage.getVotesForWord(parsed.wordId)
        : [];
      const isFirstVote = !existingVotes.some(v => v.userId === userId);

      const vote = await storage.createVote(parsed);

      let xpEarned = 0;
      if (isUnverifiedReview && isFirstVote) {
        xpEarned = 5;
        await storage.updateUserXp(userId, xpEarned);
        await storage.updateUserStreak(userId);
        await storage.createXpLog({
          userId,
          actionType: "word_review",
          xpEarned,
          details: `Reviewed community word: ${wordBefore!.latinPamiri}`,
        });
      }

      const word = await storage.getWordById(parsed.wordId);

      let autoApproved = false;
      if (word && !word.verified && word.upvotesCount >= AUTO_APPROVE_THRESHOLD) {
        await storage.approveWord(word.id);
        autoApproved = true;
      }

      return res.json({ vote, word: autoApproved ? { ...word, verified: true } : word, xpEarned, autoApproved });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // ===== WORD SUGGESTIONS =====

  app.get("/api/words/:id/suggestions", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    const suggestions = await storage.getSuggestionsForWord(Number(req.params.id));
    if (!userId) return res.json(suggestions);

    const enriched = await Promise.all(suggestions.map(async (s) => {
      const votes = await storage.getSuggestionVotesForSuggestion(s.id);
      const userVote = votes.find(v => v.userId === userId);
      return { ...s, userVoteType: userVote?.voteType || null };
    }));
    return res.json(enriched);
  });

  // Submit suggestion (authenticated)
  app.post("/api/words/:id/suggest", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parsed = insertSuggestionSchema.parse({
        wordId: Number(req.params.id),
        userId,
        latinPamiri: req.body.latinPamiri,
        cyrillicPamiri: req.body.cyrillicPamiri || "",
        english: req.body.english,
        russian: req.body.russian,
      });

      const word = await storage.getWordById(parsed.wordId);
      if (!word) return res.status(404).json({ error: "Word not found" });

      const suggestion = await storage.createSuggestion(parsed);

      await storage.updateUserXp(userId, 5);
      await storage.updateUserStreak(userId);
      await storage.createXpLog({
        userId,
        actionType: "word_suggestion",
        xpEarned: 5,
        details: `Suggested correction for: ${word.latinPamiri}`,
      });

      return res.json({ suggestion, xpEarned: 5 });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // Vote on suggestion (authenticated)
  app.post("/api/suggestions/:id/vote", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parsed = insertSuggestionVoteSchema.parse({
        suggestionId: Number(req.params.id),
        userId,
        voteType: req.body.voteType,
      });

      const suggestion = await storage.getSuggestionById(parsed.suggestionId);
      if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });

      const vote = await storage.createSuggestionVote(parsed);
      const updated = await storage.getSuggestionById(parsed.suggestionId);
      return res.json({ vote, suggestion: updated });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // Mod-only: manage suggestions
  app.post("/api/suggestions/:id/approve", requireModerator, async (req, res) => {
    const word = await storage.approveSuggestion(Number(req.params.id));
    if (!word) return res.status(404).json({ error: "Suggestion not found" });
    return res.json(word);
  });

  app.post("/api/suggestions/:id/reject", requireModerator, async (req, res) => {
    const rejected = await storage.rejectSuggestion(Number(req.params.id));
    if (!rejected) return res.status(404).json({ error: "Suggestion not found" });
    return res.json({ success: true });
  });

  app.get("/api/admin/suggestions", requireModerator, async (_req, res) => {
    const suggestions = await storage.getAllPendingSuggestions();
    return res.json(suggestions);
  });

  // ===== PROGRESS =====

  app.get("/api/progress/:userId", async (req, res) => {
    const prog = await storage.getUserProgress(req.params.userId);
    return res.json(prog);
  });

  // Record answer (authenticated)
  app.post("/api/progress", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const { wordId, correct } = req.body;
    if (wordId === undefined || correct === undefined) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const prog = await storage.recordAnswer(userId, Number(wordId), Boolean(correct));
    return res.json(prog);
  });

  // ===== QUIZ =====

  const normalizeAnswer = (s: string) =>
    (s || "").trim().normalize("NFC").toLowerCase();

  app.get("/api/quiz/:userId", async (req, res) => {
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const category = req.query.category as string | undefined;
    let pool: Word[];
    if (category) {
      pool = (await storage.getWordsByCategory(category)).filter(w => {
        const unlock = CATEGORY_UNLOCKS[w.category];
        return unlock && user.level >= unlock.level;
      });
    } else {
      pool = await storage.getUnlockedWordsForUser(user.id);
    }

    const seenKeys = new Set<string>();
    pool = pool.filter((w) => {
      const key = normalizeAnswer(w.latinPamiri) + "|" + normalizeAnswer(w.english);
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    if (pool.length < 4) {
      return res.status(400).json({ error: "Not enough words to generate a quiz" });
    }

    const script = user.preferredScript;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const quizWords = shuffled.slice(0, Math.min(10, pool.length));

    const questions: QuizQuestion[] = quizWords.map((word) => {
      const direction = Math.random() > 0.5 ? "pamiri_to_meaning" : "meaning_to_pamiri";

      const wordKey = normalizeAnswer(word.latinPamiri) + "|" + normalizeAnswer(word.english);
      const otherWords = pool
        .filter(w => {
          const k = normalizeAnswer(w.latinPamiri) + "|" + normalizeAnswer(w.english);
          return k !== wordKey;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      if (direction === "pamiri_to_meaning") {
        const pamiriText = script === "cyrillic" && word.cyrillicPamiri ? word.cyrillicPamiri : word.latinPamiri;
        const correctAnswer = `${word.russian} / ${word.english}`;
        const wrongOptions = otherWords
          .map(w => `${w.russian} / ${w.english}`)
          .filter(o => normalizeAnswer(o) !== normalizeAnswer(correctAnswer));
        const seen = new Set<string>([normalizeAnswer(correctAnswer)]);
        const uniqueWrong = wrongOptions.filter(o => {
          const k = normalizeAnswer(o); if (seen.has(k)) return false; seen.add(k); return true;
        });
        const options = [correctAnswer, ...uniqueWrong].sort(() => Math.random() - 0.5);

        return {
          wordId: word.id,
          questionType: "multiple_choice" as const,
          prompt: pamiriText,
          correctAnswer,
          options,
        };
      } else {
        const meaningText = `${word.russian} / ${word.english}`;
        const correctAnswer = script === "cyrillic" && word.cyrillicPamiri ? word.cyrillicPamiri : word.latinPamiri;
        const wrongOptions = otherWords
          .map(w => script === "cyrillic" && w.cyrillicPamiri ? w.cyrillicPamiri : w.latinPamiri)
          .filter(o => normalizeAnswer(o) !== normalizeAnswer(correctAnswer));
        const seen2 = new Set<string>([normalizeAnswer(correctAnswer)]);
        const uniqueWrong2 = wrongOptions.filter(o => {
          const k = normalizeAnswer(o); if (seen2.has(k)) return false; seen2.add(k); return true;
        });
        const options = [correctAnswer, ...uniqueWrong2].sort(() => Math.random() - 0.5);

        return {
          wordId: word.id,
          questionType: "multiple_choice" as const,
          prompt: meaningText,
          correctAnswer,
          options,
        };
      }
    });

    return res.json(questions);
  });

  // Quiz complete (authenticated — userId from session, score validated)
  app.post("/api/quiz/complete", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const { score, totalQuestions, categoryId } = req.body;

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate score: clamp to valid range
    const maxQuestions = Math.min(Math.max(Number(totalQuestions) || 0, 1), 10);
    const validatedScore = Math.max(0, Math.min(Number(score) || 0, maxQuestions));

    const oldLevel = user.level;
    let xpEarned = validatedScore * 2;
    if (validatedScore === maxQuestions && maxQuestions > 0) xpEarned += 10;

    await storage.updateUserXp(userId, xpEarned);
    await storage.updateUserStreak(userId);

    await storage.createXpLog({
      userId,
      actionType: "quiz_complete",
      xpEarned,
      details: `Quiz: ${validatedScore}/${maxQuestions}${categoryId ? ` in ${categoryId}` : ""}`,
    });

    const updatedUser = await storage.getUser(userId);
    const newLevel = updatedUser!.level;
    const newBadges: string[] = [];

    const progress = await storage.getUserProgress(userId);
    if (progress.length > 0 && !(await storage.hasBadge(userId, "first_word"))) {
      await storage.createBadge({ userId, badgeType: "first_word" });
      newBadges.push("first_word");
    }

    if (validatedScore === maxQuestions) {
      const xpLog = await storage.getXpLogForUser(userId);
      const perfectCount = xpLog.filter(l =>
        l.actionType === "quiz_complete" && l.details.includes(`${maxQuestions}/${maxQuestions}`)
      ).length;
      if (perfectCount >= 5 && !(await storage.hasBadge(userId, "perfectionist"))) {
        await storage.createBadge({ userId, badgeType: "perfectionist" });
        newBadges.push("perfectionist");
      }
    }

    if (updatedUser!.currentStreak >= 7 && !(await storage.hasBadge(userId, "streak_master"))) {
      await storage.createBadge({ userId, badgeType: "streak_master" });
      newBadges.push("streak_master");
    }

    const masteredCount = progress.filter(p => p.masteryLevel >= 3).length;
    if (masteredCount >= 100 && !(await storage.hasBadge(userId, "scholar"))) {
      await storage.createBadge({ userId, badgeType: "scholar" });
      newBadges.push("scholar");
    }

    const newUnlocks: string[] = [];
    if (newLevel > oldLevel) {
      for (const [cat, info] of Object.entries(CATEGORY_UNLOCKS)) {
        if (info.level > oldLevel && info.level <= newLevel) {
          newUnlocks.push(cat);
        }
      }
    }

    return res.json({
      xpEarned,
      newLevel,
      newBadges,
      newUnlocks,
      user: updatedUser,
    });
  });

  // Badges
  app.get("/api/badges/:userId", async (req, res) => {
    const badges = await storage.getBadgesForUser(req.params.userId);
    return res.json(badges);
  });

  // XP Log
  app.get("/api/xp-log/:userId", async (req, res) => {
    const logs = await storage.getXpLogForUser(req.params.userId);
    return res.json(logs);
  });

  // ===== ADMIN / MOD ENDPOINTS (all require moderator role) =====

  app.get("/api/admin/users", requireModerator, async (_req, res) => {
    const users = await storage.getAllUsers();
    return res.json(users);
  });

  app.delete("/api/admin/users/:id", requireModerator, async (req, res) => {
    const deleted = await storage.deleteUser(String(req.params.id));
    if (!deleted) return res.status(404).json({ error: "User not found" });
    return res.json({ success: true });
  });

  app.get("/api/admin/words", requireModerator, async (_req, res) => {
    const words = await storage.getAllWords();
    return res.json(words);
  });

  app.delete("/api/admin/words/:id", requireModerator, async (req, res) => {
    const deleted = await storage.deleteWord(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Word not found" });
    return res.json({ success: true });
  });

  // News
  app.get("/api/news", async (_req, res) => {
    const news = await storage.getAllNews();
    return res.json(news);
  });

  app.post("/api/news", requireModerator, async (req, res) => {
    try {
      const parsed = insertNewsSchema.parse(req.body);
      const newsItem = await storage.createNews(parsed);
      return res.json(newsItem);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/news/:id", requireModerator, async (req, res) => {
    const deleted = await storage.deleteNews(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "News not found" });
    return res.json({ success: true });
  });

  return httpServer;
}
