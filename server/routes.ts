import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertWordSchema, insertVoteSchema, insertNewsSchema,
  insertSuggestionSchema, insertSuggestionVoteSchema,
  CATEGORY_UNLOCKS, getLevelFromXp, getXpForNextLevel,
  type QuizQuestion, type Word,
} from "@shared/schema";

// Simple in-memory rate limiter for votes
const voteRateMap = new Map<string, number[]>();
const VOTE_RATE_LIMIT = 30; // max votes per window
const VOTE_RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (voteRateMap.get(userId) || []).filter(t => now - t < VOTE_RATE_WINDOW);
  if (timestamps.length >= VOTE_RATE_LIMIT) return true;
  timestamps.push(now);
  voteRateMap.set(userId, timestamps);
  return false;
}

// Approval threshold: when a word reaches this net score, auto-approve
const AUTO_APPROVE_THRESHOLD = 5;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, preferredLanguage, preferredScript } = req.body;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "Username is required" });
      }

      let user = await storage.getUserByUsername(username.trim());
      if (user) {
        if (preferredLanguage || preferredScript) {
          user = (await storage.updateUserPreferences(
            user.id,
            preferredLanguage || user.preferredLanguage,
            preferredScript || user.preferredScript
          ))!;
        }
        return res.json(user);
      }

      user = await storage.createUser({
        username: username.trim(),
        displayName: username.trim(),
        preferredLanguage: preferredLanguage || "en",
        preferredScript: preferredScript || "latin",
      });
      return res.json(user);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Users
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

  app.get("/api/leaderboard", async (_req, res) => {
    const users = await storage.getLeaderboard();
    return res.json(users);
  });

  // Words
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

  app.post("/api/words", async (req, res) => {
    try {
      const parsed = insertWordSchema.parse({
        ...req.body,
        source: "community",
      });
      const word = await storage.createWord(parsed);

      // Award 50 XP for contributing
      if (parsed.addedByUserId) {
        await storage.updateUserXp(parsed.addedByUserId, 50);
        await storage.createXpLog({
          userId: parsed.addedByUserId,
          actionType: "word_contribution",
          xpEarned: 50,
          details: `Contributed word: ${parsed.latinPamiri}`,
        });
        await storage.updateUserStreak(parsed.addedByUserId);
        // Check word warrior badge
        const allWords = await storage.getAllVerifiedWords();
        const unverified = await storage.getUnverifiedWords();
        const userWords = [...allWords, ...unverified].filter(w => w.addedByUserId === parsed.addedByUserId);
        if (userWords.length >= 10 && !(await storage.hasBadge(parsed.addedByUserId, "word_warrior"))) {
          await storage.createBadge({ userId: parsed.addedByUserId, badgeType: "word_warrior" });
        }
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

  // Community review queue: unverified community words the user hasn't voted on yet
  // Pass includeVoted=true for moderator view (shows all pending words including already-voted)
  app.get("/api/words/pending-review", async (req, res) => {
    const userId = req.query.userId as string;
    const includeVoted = req.query.includeVoted === "true";
    if (!userId) return res.status(400).json({ error: "userId required" });
    const words = await storage.getPendingCommunityWords(userId, includeVoted);
    return res.json(words);
  });

  app.post("/api/words/:id/approve", async (req, res) => {
    const word = await storage.approveWord(Number(req.params.id));
    if (!word) return res.status(404).json({ error: "Word not found" });
    return res.json(word);
  });

  app.post("/api/words/:id/reject", async (req, res) => {
    const deleted = await storage.rejectWord(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Word not found" });
    return res.json({ success: true });
  });

  app.post("/api/words/:id/vote", async (req, res) => {
    try {
      const parsed = insertVoteSchema.parse({
        wordId: Number(req.params.id),
        userId: req.body.userId,
        voteType: req.body.voteType,
      });

      // Rate limit check
      if (isRateLimited(parsed.userId)) {
        return res.status(429).json({ error: "Too many votes. Please slow down." });
      }

      // Check word state before vote (to detect if it's an unverified review)
      const wordBefore = await storage.getWordById(parsed.wordId);
      const isUnverifiedReview = wordBefore && !wordBefore.verified;

      // Check whether user has already voted (first-time vote earns XP)
      const existingVotes = isUnverifiedReview
        ? await storage.getVotesForWord(parsed.wordId)
        : [];
      const isFirstVote = !existingVotes.some(v => v.userId === parsed.userId);

      // Record the vote
      const vote = await storage.createVote(parsed);

      // Award XP for first-time review of an unverified community word
      let xpEarned = 0;
      if (isUnverifiedReview && isFirstVote) {
        xpEarned = 5;
        await storage.updateUserXp(parsed.userId, xpEarned);
        await storage.updateUserStreak(parsed.userId);
        await storage.createXpLog({
          userId: parsed.userId,
          actionType: "word_review",
          xpEarned,
          details: `Reviewed community word: ${wordBefore!.latinPamiri}`,
        });
      }

      // Fetch updated word (recalcVotes already ran inside createVote)
      const word = await storage.getWordById(parsed.wordId);

      // Auto-approve if net votes reach threshold
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

  // Get suggestions for a word (optionally with user's votes)
  app.get("/api/words/:id/suggestions", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    const suggestions = await storage.getSuggestionsForWord(Number(req.params.id));
    if (!userId) return res.json(suggestions);

    // Attach user's vote to each suggestion
    const enriched = await Promise.all(suggestions.map(async (s) => {
      const votes = await storage.getSuggestionVotesForSuggestion(s.id);
      const userVote = votes.find(v => v.userId === userId);
      return { ...s, userVoteType: userVote?.voteType || null };
    }));
    return res.json(enriched);
  });

  // Submit a correction suggestion
  app.post("/api/words/:id/suggest", async (req, res) => {
    try {
      const parsed = insertSuggestionSchema.parse({
        wordId: Number(req.params.id),
        userId: req.body.userId,
        latinPamiri: req.body.latinPamiri,
        cyrillicPamiri: req.body.cyrillicPamiri || "",
        english: req.body.english,
        russian: req.body.russian,
      });

      // Verify the word exists
      const word = await storage.getWordById(parsed.wordId);
      if (!word) return res.status(404).json({ error: "Word not found" });

      const suggestion = await storage.createSuggestion(parsed);

      // Award 5 XP for submitting a suggestion
      await storage.updateUserXp(parsed.userId, 5);
      await storage.updateUserStreak(parsed.userId);
      await storage.createXpLog({
        userId: parsed.userId,
        actionType: "word_suggestion",
        xpEarned: 5,
        details: `Suggested correction for: ${word.latinPamiri}`,
      });

      return res.json({ suggestion, xpEarned: 5 });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // Vote on a suggestion
  app.post("/api/suggestions/:id/vote", async (req, res) => {
    try {
      const parsed = insertSuggestionVoteSchema.parse({
        suggestionId: Number(req.params.id),
        userId: req.body.userId,
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

  // Mod: approve a suggestion (applies changes to word)
  app.post("/api/suggestions/:id/approve", async (req, res) => {
    const word = await storage.approveSuggestion(Number(req.params.id));
    if (!word) return res.status(404).json({ error: "Suggestion not found" });
    return res.json(word);
  });

  // Mod: reject a suggestion
  app.post("/api/suggestions/:id/reject", async (req, res) => {
    const rejected = await storage.rejectSuggestion(Number(req.params.id));
    if (!rejected) return res.status(404).json({ error: "Suggestion not found" });
    return res.json({ success: true });
  });

  // Mod: get all pending suggestions
  app.get("/api/admin/suggestions", async (_req, res) => {
    const suggestions = await storage.getAllPendingSuggestions();
    return res.json(suggestions);
  });

  // Progress
  app.get("/api/progress/:userId", async (req, res) => {
    const prog = await storage.getUserProgress(req.params.userId);
    return res.json(prog);
  });

  app.post("/api/progress", async (req, res) => {
    const { userId, wordId, correct } = req.body;
    if (!userId || wordId === undefined || correct === undefined) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const prog = await storage.recordAnswer(userId, Number(wordId), Boolean(correct));
    return res.json(prog);
  });

  // Normalize string for deduplication and comparison (trim + lowercase + Unicode NFC)
  const normalizeAnswer = (s: string) =>
    (s || "").trim().normalize("NFC").toLowerCase();

  // Quiz generation
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

    // Deduplicate by normalized word form so the same word cannot appear twice in a quiz
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

    // Shuffle and pick 10 (or fewer)
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const quizWords = shuffled.slice(0, Math.min(10, pool.length));

    const questions: QuizQuestion[] = quizWords.map((word) => {
      const direction = Math.random() > 0.5 ? "pamiri_to_meaning" : "meaning_to_pamiri";

      // Get wrong answers from pool (exclude same word by normalized form so options are unique)
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

  // Quiz complete
  app.post("/api/quiz/complete", async (req, res) => {
    const { userId, score, totalQuestions, categoryId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const oldLevel = user.level;
    let xpEarned = (score || 0) * 2;
    if (score === totalQuestions) xpEarned += 10; // perfect bonus

    await storage.updateUserXp(userId, xpEarned);
    await storage.updateUserStreak(userId);

    await storage.createXpLog({
      userId,
      actionType: "quiz_complete",
      xpEarned,
      details: `Quiz: ${score}/${totalQuestions}${categoryId ? ` in ${categoryId}` : ""}`,
    });

    const updatedUser = await storage.getUser(userId);
    const newLevel = updatedUser!.level;
    const newBadges: string[] = [];

    // Check first word badge
    const progress = await storage.getUserProgress(userId);
    if (progress.length > 0 && !(await storage.hasBadge(userId, "first_word"))) {
      await storage.createBadge({ userId, badgeType: "first_word" });
      newBadges.push("first_word");
    }

    // Perfectionist badge (5 perfect scores)
    if (score === totalQuestions) {
      const xpLog = await storage.getXpLogForUser(userId);
      const perfectCount = xpLog.filter(l =>
        l.actionType === "quiz_complete" && l.details.includes(`${totalQuestions}/${totalQuestions}`)
      ).length;
      if (perfectCount >= 5 && !(await storage.hasBadge(userId, "perfectionist"))) {
        await storage.createBadge({ userId, badgeType: "perfectionist" });
        newBadges.push("perfectionist");
      }
    }

    // Streak master
    if (updatedUser!.currentStreak >= 7 && !(await storage.hasBadge(userId, "streak_master"))) {
      await storage.createBadge({ userId, badgeType: "streak_master" });
      newBadges.push("streak_master");
    }

    // Scholar badge (100 words mastered)
    const masteredCount = progress.filter(p => p.masteryLevel >= 3).length;
    if (masteredCount >= 100 && !(await storage.hasBadge(userId, "scholar"))) {
      await storage.createBadge({ userId, badgeType: "scholar" });
      newBadges.push("scholar");
    }

    // Check new unlocks
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

  // ===== ADMIN / MOD ENDPOINTS =====

  // List all users
  app.get("/api/admin/users", async (_req, res) => {
    const users = await storage.getAllUsers();
    return res.json(users);
  });

  // Delete a user
  app.delete("/api/admin/users/:id", async (req, res) => {
    const deleted = await storage.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    return res.json({ success: true });
  });

  // List ALL words (verified + unverified)
  app.get("/api/admin/words", async (_req, res) => {
    const words = await storage.getAllWords();
    return res.json(words);
  });

  // Delete any word
  app.delete("/api/admin/words/:id", async (req, res) => {
    const deleted = await storage.deleteWord(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Word not found" });
    return res.json({ success: true });
  });

  // News CRUD
  app.get("/api/news", async (_req, res) => {
    const news = await storage.getAllNews();
    return res.json(news);
  });

  app.post("/api/news", async (req, res) => {
    try {
      const parsed = insertNewsSchema.parse(req.body);
      const newsItem = await storage.createNews(parsed);
      return res.json(newsItem);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    const deleted = await storage.deleteNews(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "News not found" });
    return res.json({ success: true });
  });

  return httpServer;
}
