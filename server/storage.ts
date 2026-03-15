import {
  type User, type InsertUser,
  type Word, type InsertWord,
  type UserProgress, type InsertProgress,
  type WordVote, type InsertVote,
  type XpLog, type InsertXpLog,
  type Badge, type InsertBadge,
  type NewsItem, type InsertNews,
  CATEGORY_UNLOCKS, getLevelFromXp,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserXp(id: string, xp: number): Promise<User | undefined>;
  updateUserStreak(id: string): Promise<User | undefined>;
  updateUserPreferences(id: string, lang: string, script: string): Promise<User | undefined>;
  getLeaderboard(): Promise<User[]>;

  // Words
  getAllVerifiedWords(): Promise<Word[]>;
  getWordsByCategory(category: string): Promise<Word[]>;
  getUnverifiedWords(): Promise<Word[]>;
  getWordById(id: number): Promise<Word | undefined>;
  createWord(word: InsertWord): Promise<Word>;
  approveWord(id: number): Promise<Word | undefined>;
  rejectWord(id: number): Promise<boolean>;
  getUnlockedWordsForUser(userId: string): Promise<Word[]>;
  getCategoriesWithUnlockInfo(userId: string): Promise<Array<{ category: string; wordCount: number; unlocked: boolean; level: number; xpRequired: number }>>;

  // Progress
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getProgressForWord(userId: string, wordId: number): Promise<UserProgress | undefined>;
  recordAnswer(userId: string, wordId: number, correct: boolean): Promise<UserProgress>;

  // Votes
  createVote(vote: InsertVote): Promise<WordVote>;
  getVotesForWord(wordId: number): Promise<WordVote[]>;

  // XP Log
  createXpLog(entry: InsertXpLog): Promise<XpLog>;
  getXpLogForUser(userId: string): Promise<XpLog[]>;

  // Badges
  createBadge(badge: InsertBadge): Promise<Badge>;
  getBadgesForUser(userId: string): Promise<Badge[]>;
  hasBadge(userId: string, badgeType: string): Promise<boolean>;

  // Admin: Users
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Admin: All words (verified + unverified)
  getAllWords(): Promise<Word[]>;
  deleteWord(id: number): Promise<boolean>;

  // News
  createNews(news: InsertNews): Promise<NewsItem>;
  getAllNews(): Promise<NewsItem[]>;
  deleteNews(id: number): Promise<boolean>;
}

export class SqliteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.DATABASE_PATH || join(process.cwd(), "deve.db");
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.initTables();
    this.loadSeedData();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        preferred_language TEXT NOT NULL DEFAULT 'ru',
        preferred_script TEXT NOT NULL DEFAULT 'latin',
        role TEXT NOT NULL DEFAULT 'user',
        total_xp INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_active_date TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latin_pamiri TEXT NOT NULL,
        cyrillic_pamiri TEXT NOT NULL DEFAULT '',
        english TEXT NOT NULL,
        russian TEXT NOT NULL,
        category TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'community',
        added_by_user_id TEXT,
        verified INTEGER NOT NULL DEFAULT 0,
        upvotes_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        word_id INTEGER NOT NULL,
        correct_count INTEGER NOT NULL DEFAULT 0,
        incorrect_count INTEGER NOT NULL DEFAULT 0,
        mastery_level INTEGER NOT NULL DEFAULT 0,
        last_reviewed_at TEXT,
        UNIQUE(user_id, word_id)
      );

      CREATE TABLE IF NOT EXISTS word_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        vote_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(word_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS xp_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        xp_earned INTEGER NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        badge_type TEXT NOT NULL,
        earned_at TEXT NOT NULL,
        UNIQUE(user_id, badge_type)
      );

      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
      CREATE INDEX IF NOT EXISTS idx_words_verified ON words(verified);
      CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_xp ON users(total_xp DESC);
    `);
  }

  private loadSeedData() {
    // Only load if words table is empty
    const count = this.db.prepare("SELECT COUNT(*) as c FROM words").get() as { c: number };
    if (count.c > 0) return;

    try {
      const seedPath = join(process.cwd(), "seed_words.json");
      const data = JSON.parse(readFileSync(seedPath, "utf-8"));
      const insert = this.db.prepare(`
        INSERT INTO words (latin_pamiri, cyrillic_pamiri, english, russian, category, source, added_by_user_id, verified, upvotes_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, 1, 0, ?)
      `);
      const now = new Date().toISOString();
      const insertMany = this.db.transaction((entries: any[]) => {
        for (const entry of entries) {
          insert.run(
            entry.latin_pamiri,
            entry.cyrillic_pamiri || "",
            entry.english,
            entry.russian,
            entry.category,
            entry.source || "zarubin",
            now
          );
        }
      });
      insertMany(data);
      console.log(`Loaded ${data.length} seed words into database`);
    } catch (e) {
      console.error("Failed to load seed data:", e);
    }
  }

  private rowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      preferredLanguage: row.preferred_language,
      preferredScript: row.preferred_script,
      role: row.role,
      totalXp: row.total_xp,
      level: row.level,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastActiveDate: row.last_active_date,
      createdAt: row.created_at,
    };
  }

  private rowToWord(row: any): Word {
    return {
      id: row.id,
      latinPamiri: row.latin_pamiri,
      cyrillicPamiri: row.cyrillic_pamiri,
      english: row.english,
      russian: row.russian,
      category: row.category,
      source: row.source,
      addedByUserId: row.added_by_user_id,
      verified: !!row.verified,
      upvotesCount: row.upvotes_count,
      createdAt: row.created_at,
    };
  }

  private rowToProgress(row: any): UserProgress {
    return {
      id: row.id,
      userId: row.user_id,
      wordId: row.word_id,
      correctCount: row.correct_count,
      incorrectCount: row.incorrect_count,
      masteryLevel: row.mastery_level,
      lastReviewedAt: row.last_reviewed_at,
    };
  }

  private rowToVote(row: any): WordVote {
    return {
      id: row.id,
      wordId: row.word_id,
      userId: row.user_id,
      voteType: row.vote_type,
      createdAt: row.created_at,
    };
  }

  private rowToXpLog(row: any): XpLog {
    return {
      id: row.id,
      userId: row.user_id,
      actionType: row.action_type,
      xpEarned: row.xp_earned,
      details: row.details,
      createdAt: row.created_at,
    };
  }

  private rowToBadge(row: any): Badge {
    return {
      id: row.id,
      userId: row.user_id,
      badgeType: row.badge_type,
      earnedAt: row.earned_at,
    };
  }

  // Users
  async createUser(insert: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const role = insert.username === "kalkut2014" ? "moderator" : "user";
    this.db.prepare(`
      INSERT INTO users (id, username, display_name, preferred_language, preferred_script, role, total_xp, level, current_streak, longest_streak, last_active_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1, 0, 0, NULL, ?)
    `).run(id, insert.username, insert.displayName, insert.preferredLanguage || "ru", insert.preferredScript || "latin", role, now);

    return (await this.getUser(id))!;
  }

  async getUser(id: string): Promise<User | undefined> {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    return row ? this.rowToUser(row) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const row = this.db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    return row ? this.rowToUser(row) : undefined;
  }

  async updateUserXp(id: string, xp: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newXp = user.totalXp + xp;
    const newLevel = getLevelFromXp(newXp);
    this.db.prepare("UPDATE users SET total_xp = ?, level = ? WHERE id = ?").run(newXp, newLevel, id);
    return this.getUser(id);
  }

  async updateUserStreak(id: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const today = new Date().toISOString().split("T")[0];
    if (user.lastActiveDate === today) return user;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    let newStreak: number;
    if (user.lastActiveDate === yesterday) {
      newStreak = user.currentStreak + 1;
    } else {
      newStreak = 1;
    }
    const newLongest = Math.max(newStreak, user.longestStreak);
    this.db.prepare("UPDATE users SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?")
      .run(newStreak, newLongest, today, id);
    return this.getUser(id);
  }

  async updateUserPreferences(id: string, lang: string, script: string): Promise<User | undefined> {
    this.db.prepare("UPDATE users SET preferred_language = ?, preferred_script = ? WHERE id = ?")
      .run(lang, script, id);
    return this.getUser(id);
  }

  async getLeaderboard(): Promise<User[]> {
    const rows = this.db.prepare("SELECT * FROM users WHERE role != 'moderator' ORDER BY total_xp DESC LIMIT 20").all() as any[];
    return rows.map(r => this.rowToUser(r));
  }

  // Words
  async getAllVerifiedWords(): Promise<Word[]> {
    const rows = this.db.prepare("SELECT * FROM words WHERE verified = 1").all() as any[];
    return rows.map(r => this.rowToWord(r));
  }

  async getWordsByCategory(category: string): Promise<Word[]> {
    const rows = this.db.prepare("SELECT * FROM words WHERE verified = 1 AND category = ?").all(category) as any[];
    return rows.map(r => this.rowToWord(r));
  }

  async getUnverifiedWords(): Promise<Word[]> {
    const rows = this.db.prepare("SELECT * FROM words WHERE verified = 0").all() as any[];
    return rows.map(r => this.rowToWord(r));
  }

  async getWordById(id: number): Promise<Word | undefined> {
    const row = this.db.prepare("SELECT * FROM words WHERE id = ?").get(id) as any;
    return row ? this.rowToWord(row) : undefined;
  }

  async createWord(insert: InsertWord): Promise<Word> {
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT INTO words (latin_pamiri, cyrillic_pamiri, english, russian, category, source, added_by_user_id, verified, upvotes_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
    `).run(
      insert.latinPamiri,
      insert.cyrillicPamiri || "",
      insert.english,
      insert.russian,
      insert.category,
      insert.source || "community",
      insert.addedByUserId || null,
      now
    );
    return (await this.getWordById(Number(result.lastInsertRowid)))!;
  }

  async approveWord(id: number): Promise<Word | undefined> {
    this.db.prepare("UPDATE words SET verified = 1 WHERE id = ?").run(id);
    return this.getWordById(id);
  }

  async rejectWord(id: number): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM words WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async getUnlockedWordsForUser(userId: string): Promise<Word[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    const allVerified = await this.getAllVerifiedWords();
    return allVerified.filter(w => {
      const unlock = CATEGORY_UNLOCKS[w.category];
      return unlock && user.level >= unlock.level;
    });
  }

  async getCategoriesWithUnlockInfo(userId: string): Promise<Array<{ category: string; wordCount: number; unlocked: boolean; level: number; xpRequired: number }>> {
    const user = await this.getUser(userId);
    const rows = this.db.prepare(
      "SELECT category, COUNT(*) as cnt FROM words WHERE verified = 1 GROUP BY category"
    ).all() as any[];
    const categoryCounts: Record<string, number> = {};
    for (const r of rows) {
      categoryCounts[r.category] = r.cnt;
    }

    return Object.entries(CATEGORY_UNLOCKS).map(([category, info]) => ({
      category,
      wordCount: categoryCounts[category] || 0,
      unlocked: user ? user.level >= info.level : false,
      level: info.level,
      xpRequired: info.xpRequired,
    }));
  }

  // Progress
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const rows = this.db.prepare("SELECT * FROM user_progress WHERE user_id = ?").all(userId) as any[];
    return rows.map(r => this.rowToProgress(r));
  }

  async getProgressForWord(userId: string, wordId: number): Promise<UserProgress | undefined> {
    const row = this.db.prepare("SELECT * FROM user_progress WHERE user_id = ? AND word_id = ?").get(userId, wordId) as any;
    return row ? this.rowToProgress(row) : undefined;
  }

  async recordAnswer(userId: string, wordId: number, correct: boolean): Promise<UserProgress> {
    const existing = await this.getProgressForWord(userId, wordId);
    const now = new Date().toISOString();

    if (existing) {
      if (correct) {
        const newCorrect = existing.correctCount + 1;
        const newMastery = Math.min(5, Math.floor(newCorrect / 2));
        this.db.prepare(
          "UPDATE user_progress SET correct_count = ?, mastery_level = ?, last_reviewed_at = ? WHERE id = ?"
        ).run(newCorrect, newMastery, now, existing.id);
      } else {
        this.db.prepare(
          "UPDATE user_progress SET incorrect_count = incorrect_count + 1, last_reviewed_at = ? WHERE id = ?"
        ).run(now, existing.id);
      }
      return (await this.getProgressForWord(userId, wordId))!;
    }

    const result = this.db.prepare(`
      INSERT INTO user_progress (user_id, word_id, correct_count, incorrect_count, mastery_level, last_reviewed_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(userId, wordId, correct ? 1 : 0, correct ? 0 : 1, now);

    const row = this.db.prepare("SELECT * FROM user_progress WHERE id = ?").get(Number(result.lastInsertRowid)) as any;
    return this.rowToProgress(row);
  }

  // Votes
  async createVote(vote: InsertVote): Promise<WordVote> {
    const now = new Date().toISOString();
    // Upsert: if user already voted, update
    const existing = this.db.prepare(
      "SELECT * FROM word_votes WHERE word_id = ? AND user_id = ?"
    ).get(vote.wordId, vote.userId) as any;

    if (existing) {
      this.db.prepare("UPDATE word_votes SET vote_type = ? WHERE id = ?").run(vote.voteType, existing.id);
      this.recalcVotes(vote.wordId);
      const row = this.db.prepare("SELECT * FROM word_votes WHERE id = ?").get(existing.id) as any;
      return this.rowToVote(row);
    }

    const result = this.db.prepare(`
      INSERT INTO word_votes (word_id, user_id, vote_type, created_at)
      VALUES (?, ?, ?, ?)
    `).run(vote.wordId, vote.userId, vote.voteType, now);

    this.recalcVotes(vote.wordId);
    const row = this.db.prepare("SELECT * FROM word_votes WHERE id = ?").get(Number(result.lastInsertRowid)) as any;
    return this.rowToVote(row);
  }

  private recalcVotes(wordId: number) {
    const ups = (this.db.prepare("SELECT COUNT(*) as c FROM word_votes WHERE word_id = ? AND vote_type = 'up'").get(wordId) as any).c;
    const downs = (this.db.prepare("SELECT COUNT(*) as c FROM word_votes WHERE word_id = ? AND vote_type = 'down'").get(wordId) as any).c;
    this.db.prepare("UPDATE words SET upvotes_count = ? WHERE id = ?").run(ups - downs, wordId);
  }

  async getVotesForWord(wordId: number): Promise<WordVote[]> {
    const rows = this.db.prepare("SELECT * FROM word_votes WHERE word_id = ?").all(wordId) as any[];
    return rows.map(r => this.rowToVote(r));
  }

  // XP Log
  async createXpLog(entry: InsertXpLog): Promise<XpLog> {
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT INTO xp_logs (user_id, action_type, xp_earned, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(entry.userId, entry.actionType, entry.xpEarned, entry.details || "", now);
    const row = this.db.prepare("SELECT * FROM xp_logs WHERE id = ?").get(Number(result.lastInsertRowid)) as any;
    return this.rowToXpLog(row);
  }

  async getXpLogForUser(userId: string): Promise<XpLog[]> {
    const rows = this.db.prepare(
      "SELECT * FROM xp_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
    ).all(userId) as any[];
    return rows.map(r => this.rowToXpLog(r));
  }

  // Badges
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT OR IGNORE INTO badges (user_id, badge_type, earned_at)
      VALUES (?, ?, ?)
    `).run(badge.userId, badge.badgeType, now);
    const row = this.db.prepare("SELECT * FROM badges WHERE user_id = ? AND badge_type = ?")
      .get(badge.userId, badge.badgeType) as any;
    return this.rowToBadge(row);
  }

  async getBadgesForUser(userId: string): Promise<Badge[]> {
    const rows = this.db.prepare("SELECT * FROM badges WHERE user_id = ?").all(userId) as any[];
    return rows.map(r => this.rowToBadge(r));
  }

  async hasBadge(userId: string, badgeType: string): Promise<boolean> {
    const row = this.db.prepare("SELECT 1 FROM badges WHERE user_id = ? AND badge_type = ?").get(userId, badgeType);
    return !!row;
  }

  // Admin: Users
  async getAllUsers(): Promise<User[]> {
    const rows = this.db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as any[];
    return rows.map(r => this.rowToUser(r));
  }

  async deleteUser(id: string): Promise<boolean> {
    // Delete all related data
    this.db.prepare("DELETE FROM user_progress WHERE user_id = ?").run(id);
    this.db.prepare("DELETE FROM word_votes WHERE user_id = ?").run(id);
    this.db.prepare("DELETE FROM xp_logs WHERE user_id = ?").run(id);
    this.db.prepare("DELETE FROM badges WHERE user_id = ?").run(id);
    const result = this.db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return result.changes > 0;
  }

  // Admin: All words
  async getAllWords(): Promise<Word[]> {
    const rows = this.db.prepare("SELECT * FROM words ORDER BY created_at DESC").all() as any[];
    return rows.map(r => this.rowToWord(r));
  }

  async deleteWord(id: number): Promise<boolean> {
    this.db.prepare("DELETE FROM user_progress WHERE word_id = ?").run(id);
    this.db.prepare("DELETE FROM word_votes WHERE word_id = ?").run(id);
    const result = this.db.prepare("DELETE FROM words WHERE id = ?").run(id);
    return result.changes > 0;
  }

  // News
  private rowToNews(row: any): NewsItem {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.author_id,
      createdAt: row.created_at,
    };
  }

  async createNews(news: InsertNews): Promise<NewsItem> {
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT INTO news (title, content, author_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(news.title, news.content, news.authorId, now);
    const row = this.db.prepare("SELECT * FROM news WHERE id = ?").get(Number(result.lastInsertRowid)) as any;
    return this.rowToNews(row);
  }

  async getAllNews(): Promise<NewsItem[]> {
    const rows = this.db.prepare("SELECT * FROM news ORDER BY created_at DESC").all() as any[];
    return rows.map(r => this.rowToNews(r));
  }

  async deleteNews(id: number): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM news WHERE id = ?").run(id);
    return result.changes > 0;
  }
}

export const storage = new SqliteStorage();
