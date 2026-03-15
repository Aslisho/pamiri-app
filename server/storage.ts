import {
  type User, type InsertUser,
  type Word, type InsertWord,
  type UserProgress, type InsertProgress,
  type WordVote, type InsertVote,
  type XpLog, type InsertXpLog,
  type Badge, type InsertBadge,
  type NewsItem, type InsertNews,
  type PendingWordReview,
  CATEGORY_UNLOCKS, getLevelFromXp,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import pg from "pg";
const { Pool } = pg;

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
  getPendingCommunityWords(userId: string): Promise<PendingWordReview[]>;

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

// ─── PostgreSQL Storage ─────────────────────────────────────────────────────

export class PostgresStorage implements IStorage {
  private pool: pg.Pool;
  private initialized: Promise<void>;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("render.com")
        ? { rejectUnauthorized: false }
        : undefined,
    });
    this.initialized = this.init();
  }

  private async init() {
    await this.initTables();
    await this.loadSeedData();
    await this.updateSeedData();
  }

  async ready() {
    await this.initialized;
  }

  private async initTables() {
    await this.pool.query(`
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
        id SERIAL PRIMARY KEY,
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
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        word_id INTEGER NOT NULL,
        correct_count INTEGER NOT NULL DEFAULT 0,
        incorrect_count INTEGER NOT NULL DEFAULT 0,
        mastery_level INTEGER NOT NULL DEFAULT 0,
        last_reviewed_at TEXT,
        UNIQUE(user_id, word_id)
      );

      CREATE TABLE IF NOT EXISTS word_votes (
        id SERIAL PRIMARY KEY,
        word_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        vote_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(word_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS xp_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        xp_earned INTEGER NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        badge_type TEXT NOT NULL,
        earned_at TEXT NOT NULL,
        UNIQUE(user_id, badge_type)
      );

      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Create indexes (using IF NOT EXISTS)
    await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_words_category ON words(category)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_words_verified ON words(verified)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_users_xp ON users(total_xp DESC)`);
  }

  private async loadSeedData() {
    const { rows } = await this.pool.query("SELECT COUNT(*) as c FROM words");
    if (parseInt(rows[0].c) > 0) return;

    try {
      const seedPath = join(process.cwd(), "seed_words.json");
      const data = JSON.parse(readFileSync(seedPath, "utf-8"));
      const now = new Date().toISOString();

      // Batch insert seed words
      for (const entry of data) {
        await this.pool.query(
          `INSERT INTO words (latin_pamiri, cyrillic_pamiri, english, russian, category, source, added_by_user_id, verified, upvotes_count, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NULL, 1, 0, $7)`,
          [
            entry.latin_pamiri,
            entry.cyrillic_pamiri || "",
            entry.english,
            entry.russian,
            entry.category,
            entry.source || "zarubin",
            now,
          ]
        );
      }
      console.log(`Loaded ${data.length} seed words into database`);
    } catch (e) {
      console.error("Failed to load seed data:", e);
    }
  }

  private async updateSeedData() {
    try {
      const seedPath = join(process.cwd(), "seed_words.json");
      const data = JSON.parse(readFileSync(seedPath, "utf-8"));
      let updated = 0;
      for (const entry of data) {
        const result = await this.pool.query(
          `UPDATE words SET latin_pamiri = $1, cyrillic_pamiri = $2, russian = $3
           WHERE english = $4 AND category = $5 AND source = $6
             AND latin_pamiri IS DISTINCT FROM $1`,
          [
            entry.latin_pamiri,
            entry.cyrillic_pamiri || "",
            entry.russian,
            entry.english,
            entry.category,
            entry.source || "zarubin",
          ]
        );
        updated += result.rowCount ?? 0;
      }
      if (updated > 0) console.log(`Updated ${updated} seed words with correct diacritics`);
    } catch (e) {
      console.error("Failed to update seed data:", e);
    }
  }

  // ─── Row mappers ────────────────────────────────────────────────

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

  private rowToNews(row: any): NewsItem {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.author_id,
      createdAt: row.created_at,
    };
  }

  // ─── Users ──────────────────────────────────────────────────────

  async createUser(insert: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const role = insert.username === "kalkut2014" ? "moderator" : "user";
    await this.pool.query(
      `INSERT INTO users (id, username, display_name, preferred_language, preferred_script, role, total_xp, level, current_streak, longest_streak, last_active_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 1, 0, 0, NULL, $7)`,
      [id, insert.username, insert.displayName, insert.preferredLanguage || "ru", insert.preferredScript || "latin", role, now]
    );
    return (await this.getUser(id))!;
  }

  async getUser(id: string): Promise<User | undefined> {
    const { rows } = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ? this.rowToUser(rows[0]) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { rows } = await this.pool.query("SELECT * FROM users WHERE username = $1", [username]);
    return rows[0] ? this.rowToUser(rows[0]) : undefined;
  }

  async updateUserXp(id: string, xp: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newXp = user.totalXp + xp;
    const newLevel = getLevelFromXp(newXp);
    await this.pool.query("UPDATE users SET total_xp = $1, level = $2 WHERE id = $3", [newXp, newLevel, id]);
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
    await this.pool.query(
      "UPDATE users SET current_streak = $1, longest_streak = $2, last_active_date = $3 WHERE id = $4",
      [newStreak, newLongest, today, id]
    );
    return this.getUser(id);
  }

  async updateUserPreferences(id: string, lang: string, script: string): Promise<User | undefined> {
    await this.pool.query(
      "UPDATE users SET preferred_language = $1, preferred_script = $2 WHERE id = $3",
      [lang, script, id]
    );
    return this.getUser(id);
  }

  async getLeaderboard(): Promise<User[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM users WHERE role != 'moderator' ORDER BY total_xp DESC LIMIT 20"
    );
    return rows.map(r => this.rowToUser(r));
  }

  // ─── Words ──────────────────────────────────────────────────────

  async getAllVerifiedWords(): Promise<Word[]> {
    const { rows } = await this.pool.query("SELECT * FROM words WHERE verified = 1");
    return rows.map(r => this.rowToWord(r));
  }

  async getWordsByCategory(category: string): Promise<Word[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM words WHERE verified = 1 AND category = $1", [category]
    );
    return rows.map(r => this.rowToWord(r));
  }

  async getUnverifiedWords(): Promise<Word[]> {
    const { rows } = await this.pool.query("SELECT * FROM words WHERE verified = 0");
    return rows.map(r => this.rowToWord(r));
  }

  async getWordById(id: number): Promise<Word | undefined> {
    const { rows } = await this.pool.query("SELECT * FROM words WHERE id = $1", [id]);
    return rows[0] ? this.rowToWord(rows[0]) : undefined;
  }

  async createWord(insert: InsertWord): Promise<Word> {
    const now = new Date().toISOString();
    const { rows } = await this.pool.query(
      `INSERT INTO words (latin_pamiri, cyrillic_pamiri, english, russian, category, source, added_by_user_id, verified, upvotes_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8) RETURNING id`,
      [
        insert.latinPamiri,
        insert.cyrillicPamiri || "",
        insert.english,
        insert.russian,
        insert.category,
        insert.source || "community",
        insert.addedByUserId || null,
        now,
      ]
    );
    return (await this.getWordById(rows[0].id))!;
  }

  async approveWord(id: number): Promise<Word | undefined> {
    await this.pool.query("UPDATE words SET verified = 1 WHERE id = $1", [id]);
    return this.getWordById(id);
  }

  async rejectWord(id: number): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM words WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
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
    const { rows } = await this.pool.query(
      "SELECT category, COUNT(*) as cnt FROM words WHERE verified = 1 GROUP BY category"
    );
    const categoryCounts: Record<string, number> = {};
    for (const r of rows) {
      categoryCounts[r.category] = parseInt(r.cnt);
    }

    return Object.entries(CATEGORY_UNLOCKS).map(([category, info]) => ({
      category,
      wordCount: categoryCounts[category] || 0,
      unlocked: user ? user.level >= info.level : false,
      level: info.level,
      xpRequired: info.xpRequired,
    }));
  }

  // ─── Progress ───────────────────────────────────────────────────

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const { rows } = await this.pool.query("SELECT * FROM user_progress WHERE user_id = $1", [userId]);
    return rows.map(r => this.rowToProgress(r));
  }

  async getProgressForWord(userId: string, wordId: number): Promise<UserProgress | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM user_progress WHERE user_id = $1 AND word_id = $2", [userId, wordId]
    );
    return rows[0] ? this.rowToProgress(rows[0]) : undefined;
  }

  async recordAnswer(userId: string, wordId: number, correct: boolean): Promise<UserProgress> {
    const existing = await this.getProgressForWord(userId, wordId);
    const now = new Date().toISOString();

    if (existing) {
      if (correct) {
        const newCorrect = existing.correctCount + 1;
        const newMastery = Math.min(5, Math.floor(newCorrect / 2));
        await this.pool.query(
          "UPDATE user_progress SET correct_count = $1, mastery_level = $2, last_reviewed_at = $3 WHERE id = $4",
          [newCorrect, newMastery, now, existing.id]
        );
      } else {
        await this.pool.query(
          "UPDATE user_progress SET incorrect_count = incorrect_count + 1, last_reviewed_at = $1 WHERE id = $2",
          [now, existing.id]
        );
      }
      return (await this.getProgressForWord(userId, wordId))!;
    }

    const { rows } = await this.pool.query(
      `INSERT INTO user_progress (user_id, word_id, correct_count, incorrect_count, mastery_level, last_reviewed_at)
       VALUES ($1, $2, $3, $4, 0, $5) RETURNING id`,
      [userId, wordId, correct ? 1 : 0, correct ? 0 : 1, now]
    );
    return (await this.getProgressForWord(userId, wordId))!;
  }

  // ─── Votes ──────────────────────────────────────────────────────

  async createVote(vote: InsertVote): Promise<WordVote> {
    const now = new Date().toISOString();
    const { rows: existing } = await this.pool.query(
      "SELECT * FROM word_votes WHERE word_id = $1 AND user_id = $2", [vote.wordId, vote.userId]
    );

    if (existing[0]) {
      await this.pool.query("UPDATE word_votes SET vote_type = $1 WHERE id = $2", [vote.voteType, existing[0].id]);
      await this.recalcVotes(vote.wordId);
      const { rows } = await this.pool.query("SELECT * FROM word_votes WHERE id = $1", [existing[0].id]);
      return this.rowToVote(rows[0]);
    }

    const { rows } = await this.pool.query(
      `INSERT INTO word_votes (word_id, user_id, vote_type, created_at)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [vote.wordId, vote.userId, vote.voteType, now]
    );
    await this.recalcVotes(vote.wordId);
    const { rows: voteRows } = await this.pool.query("SELECT * FROM word_votes WHERE id = $1", [rows[0].id]);
    return this.rowToVote(voteRows[0]);
  }

  private async recalcVotes(wordId: number) {
    const { rows: ups } = await this.pool.query(
      "SELECT COUNT(*) as c FROM word_votes WHERE word_id = $1 AND vote_type = 'up'", [wordId]
    );
    const { rows: downs } = await this.pool.query(
      "SELECT COUNT(*) as c FROM word_votes WHERE word_id = $1 AND vote_type = 'down'", [wordId]
    );
    await this.pool.query(
      "UPDATE words SET upvotes_count = $1 WHERE id = $2",
      [parseInt(ups[0].c) - parseInt(downs[0].c), wordId]
    );
  }

  async getVotesForWord(wordId: number): Promise<WordVote[]> {
    const { rows } = await this.pool.query("SELECT * FROM word_votes WHERE word_id = $1", [wordId]);
    return rows.map(r => this.rowToVote(r));
  }

  async getPendingCommunityWords(userId: string): Promise<PendingWordReview[]> {
    const { rows } = await this.pool.query(
      `SELECT w.*,
              uv.vote_type AS user_vote,
              COALESCE(u.cnt, 0)::int AS up_votes,
              COALESCE(d.cnt, 0)::int AS down_votes
       FROM words w
       LEFT JOIN word_votes uv ON uv.word_id = w.id AND uv.user_id = $1
       LEFT JOIN (SELECT word_id, COUNT(*) AS cnt FROM word_votes WHERE vote_type = 'up'   GROUP BY word_id) u ON u.word_id = w.id
       LEFT JOIN (SELECT word_id, COUNT(*) AS cnt FROM word_votes WHERE vote_type = 'down' GROUP BY word_id) d ON d.word_id = w.id
       WHERE w.verified = 0
         AND w.source = 'community'
         AND (w.added_by_user_id IS NULL OR w.added_by_user_id != $1)
         AND uv.vote_type IS NULL
       ORDER BY w.created_at ASC`,
      [userId]
    );
    return rows.map(r => ({
      ...this.rowToWord(r),
      userVote: r.user_vote || null,
      upVotes: parseInt(r.up_votes) || 0,
      downVotes: parseInt(r.down_votes) || 0,
    }));
  }

  // ─── XP Log ─────────────────────────────────────────────────────

  async createXpLog(entry: InsertXpLog): Promise<XpLog> {
    const now = new Date().toISOString();
    const { rows } = await this.pool.query(
      `INSERT INTO xp_logs (user_id, action_type, xp_earned, details, created_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [entry.userId, entry.actionType, entry.xpEarned, entry.details || "", now]
    );
    return this.rowToXpLog(rows[0]);
  }

  async getXpLogForUser(userId: string): Promise<XpLog[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM xp_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [userId]
    );
    return rows.map(r => this.rowToXpLog(r));
  }

  // ─── Badges ─────────────────────────────────────────────────────

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const now = new Date().toISOString();
    await this.pool.query(
      `INSERT INTO badges (user_id, badge_type, earned_at)
       VALUES ($1, $2, $3) ON CONFLICT (user_id, badge_type) DO NOTHING`,
      [badge.userId, badge.badgeType, now]
    );
    const { rows } = await this.pool.query(
      "SELECT * FROM badges WHERE user_id = $1 AND badge_type = $2",
      [badge.userId, badge.badgeType]
    );
    return this.rowToBadge(rows[0]);
  }

  async getBadgesForUser(userId: string): Promise<Badge[]> {
    const { rows } = await this.pool.query("SELECT * FROM badges WHERE user_id = $1", [userId]);
    return rows.map(r => this.rowToBadge(r));
  }

  async hasBadge(userId: string, badgeType: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      "SELECT 1 FROM badges WHERE user_id = $1 AND badge_type = $2", [userId, badgeType]
    );
    return rows.length > 0;
  }

  // ─── Admin: Users ───────────────────────────────────────────────

  async getAllUsers(): Promise<User[]> {
    const { rows } = await this.pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return rows.map(r => this.rowToUser(r));
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.pool.query("DELETE FROM user_progress WHERE user_id = $1", [id]);
    await this.pool.query("DELETE FROM word_votes WHERE user_id = $1", [id]);
    await this.pool.query("DELETE FROM xp_logs WHERE user_id = $1", [id]);
    await this.pool.query("DELETE FROM badges WHERE user_id = $1", [id]);
    const result = await this.pool.query("DELETE FROM users WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ─── Admin: All words ───────────────────────────────────────────

  async getAllWords(): Promise<Word[]> {
    const { rows } = await this.pool.query("SELECT * FROM words ORDER BY created_at DESC");
    return rows.map(r => this.rowToWord(r));
  }

  async deleteWord(id: number): Promise<boolean> {
    await this.pool.query("DELETE FROM user_progress WHERE word_id = $1", [id]);
    await this.pool.query("DELETE FROM word_votes WHERE word_id = $1", [id]);
    const result = await this.pool.query("DELETE FROM words WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ─── News ───────────────────────────────────────────────────────

  async createNews(news: InsertNews): Promise<NewsItem> {
    const now = new Date().toISOString();
    const { rows } = await this.pool.query(
      `INSERT INTO news (title, content, author_id, created_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [news.title, news.content, news.authorId, now]
    );
    return this.rowToNews(rows[0]);
  }

  async getAllNews(): Promise<NewsItem[]> {
    const { rows } = await this.pool.query("SELECT * FROM news ORDER BY created_at DESC");
    return rows.map(r => this.rowToNews(r));
  }

  async deleteNews(id: number): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM news WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

// ─── Choose storage based on environment ────────────────────────────────────

let storage: IStorage;

if (process.env.DATABASE_URL) {
  console.log("Using PostgreSQL database");
  const pgStorage = new PostgresStorage();
  pgStorage.ready().then(() => console.log("PostgreSQL tables initialized"));
  storage = pgStorage;
} else {
  console.log("No DATABASE_URL found, falling back to SQLite");
  // Dynamic import to avoid crash when better-sqlite3 is not needed
  const Database = require("better-sqlite3");

  // Keep the old SQLite class inline for fallback
  class SqliteStorage implements IStorage {
    private db: any;
    constructor() {
      const dbPath = process.env.DATABASE_PATH || join(process.cwd(), "deve.db");
      this.db = new Database(dbPath);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");
      this.initTables();
      this.loadSeedData();
      this.updateSeedData();
    }
    private initTables() {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, preferred_language TEXT NOT NULL DEFAULT 'ru', preferred_script TEXT NOT NULL DEFAULT 'latin', role TEXT NOT NULL DEFAULT 'user', total_xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1, current_streak INTEGER NOT NULL DEFAULT 0, longest_streak INTEGER NOT NULL DEFAULT 0, last_active_date TEXT, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS words (id INTEGER PRIMARY KEY AUTOINCREMENT, latin_pamiri TEXT NOT NULL, cyrillic_pamiri TEXT NOT NULL DEFAULT '', english TEXT NOT NULL, russian TEXT NOT NULL, category TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'community', added_by_user_id TEXT, verified INTEGER NOT NULL DEFAULT 0, upvotes_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS user_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, word_id INTEGER NOT NULL, correct_count INTEGER NOT NULL DEFAULT 0, incorrect_count INTEGER NOT NULL DEFAULT 0, mastery_level INTEGER NOT NULL DEFAULT 0, last_reviewed_at TEXT, UNIQUE(user_id, word_id));
        CREATE TABLE IF NOT EXISTS word_votes (id INTEGER PRIMARY KEY AUTOINCREMENT, word_id INTEGER NOT NULL, user_id TEXT NOT NULL, vote_type TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(word_id, user_id));
        CREATE TABLE IF NOT EXISTS xp_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, action_type TEXT NOT NULL, xp_earned INTEGER NOT NULL, details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS badges (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, badge_type TEXT NOT NULL, earned_at TEXT NOT NULL, UNIQUE(user_id, badge_type));
        CREATE TABLE IF NOT EXISTS news (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, author_id TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
        CREATE INDEX IF NOT EXISTS idx_words_verified ON words(verified);
        CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
        CREATE INDEX IF NOT EXISTS idx_users_xp ON users(total_xp DESC);
      `);
    }
    private loadSeedData() {
      const count = this.db.prepare("SELECT COUNT(*) as c FROM words").get() as { c: number };
      if (count.c > 0) return;
      try {
        const seedPath = join(process.cwd(), "seed_words.json");
        const data = JSON.parse(readFileSync(seedPath, "utf-8"));
        const insert = this.db.prepare(`INSERT INTO words (latin_pamiri, cyrillic_pamiri, english, russian, category, source, added_by_user_id, verified, upvotes_count, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, 0, ?)`);
        const now = new Date().toISOString();
        const insertMany = this.db.transaction((entries: any[]) => { for (const entry of entries) { insert.run(entry.latin_pamiri, entry.cyrillic_pamiri || "", entry.english, entry.russian, entry.category, entry.source || "zarubin", now); } });
        insertMany(data);
        console.log(`Loaded ${data.length} seed words into database`);
      } catch (e) { console.error("Failed to load seed data:", e); }
    }
    private updateSeedData() {
      try {
        const seedPath = join(process.cwd(), "seed_words.json");
        const data = JSON.parse(readFileSync(seedPath, "utf-8"));
        const update = this.db.prepare(`UPDATE words SET latin_pamiri = ?, cyrillic_pamiri = ?, russian = ? WHERE english = ? AND category = ? AND source = ? AND latin_pamiri != ?`);
        let updated = 0;
        for (const entry of data) {
          const r = update.run(entry.latin_pamiri, entry.cyrillic_pamiri || "", entry.russian, entry.english, entry.category, entry.source || "zarubin", entry.latin_pamiri);
          updated += r.changes;
        }
        if (updated > 0) console.log(`Updated ${updated} seed words with correct diacritics`);
      } catch (e) { console.error("Failed to update seed data:", e); }
    }
    private rowToUser(row: any): User { return { id: row.id, username: row.username, displayName: row.display_name, preferredLanguage: row.preferred_language, preferredScript: row.preferred_script, role: row.role, totalXp: row.total_xp, level: row.level, currentStreak: row.current_streak, longestStreak: row.longest_streak, lastActiveDate: row.last_active_date, createdAt: row.created_at }; }
    private rowToWord(row: any): Word { return { id: row.id, latinPamiri: row.latin_pamiri, cyrillicPamiri: row.cyrillic_pamiri, english: row.english, russian: row.russian, category: row.category, source: row.source, addedByUserId: row.added_by_user_id, verified: !!row.verified, upvotesCount: row.upvotes_count, createdAt: row.created_at }; }
    private rowToProgress(row: any): UserProgress { return { id: row.id, userId: row.user_id, wordId: row.word_id, correctCount: row.correct_count, incorrectCount: row.incorrect_count, masteryLevel: row.mastery_level, lastReviewedAt: row.last_reviewed_at }; }
    private rowToVote(row: any): WordVote { return { id: row.id, wordId: row.word_id, userId: row.user_id, voteType: row.vote_type, createdAt: row.created_at }; }
    private rowToXpLog(row: any): XpLog { return { id: row.id, userId: row.user_id, actionType: row.action_type, xpEarned: row.xp_earned, details: row.details, createdAt: row.created_at }; }
    private rowToBadge(row: any): Badge { return { id: row.id, userId: row.user_id, badgeType: row.badge_type, earnedAt: row.earned_at }; }
    private rowToNews(row: any): NewsItem { return { id: row.id, title: row.title, content: row.content, authorId: row.author_id, createdAt: row.created_at }; }

    async createUser(insert: InsertUser): Promise<User> { const id = randomUUID(); const now = new Date().toISOString(); const role = insert.username === "kalkut2014" ? "moderator" : "user"; this.db.prepare(`INSERT INTO users (id, username, display_name, preferred_language, preferred_script, role, total_xp, level, current_streak, longest_streak, last_active_date, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, 1, 0, 0, NULL, ?)`).run(id, insert.username, insert.displayName, insert.preferredLanguage || "ru", insert.preferredScript || "latin", role, now); return (await this.getUser(id))!; }
    async getUser(id: string): Promise<User | undefined> { const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any; return row ? this.rowToUser(row) : undefined; }
    async getUserByUsername(username: string): Promise<User | undefined> { const row = this.db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any; return row ? this.rowToUser(row) : undefined; }
    async updateUserXp(id: string, xp: number): Promise<User | undefined> { const user = await this.getUser(id); if (!user) return undefined; const newXp = user.totalXp + xp; const newLevel = getLevelFromXp(newXp); this.db.prepare("UPDATE users SET total_xp = ?, level = ? WHERE id = ?").run(newXp, newLevel, id); return this.getUser(id); }
    async updateUserStreak(id: string): Promise<User | undefined> { const user = await this.getUser(id); if (!user) return undefined; const today = new Date().toISOString().split("T")[0]; if (user.lastActiveDate === today) return user; const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]; let newStreak: number; if (user.lastActiveDate === yesterday) { newStreak = user.currentStreak + 1; } else { newStreak = 1; } const newLongest = Math.max(newStreak, user.longestStreak); this.db.prepare("UPDATE users SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?").run(newStreak, newLongest, today, id); return this.getUser(id); }
    async updateUserPreferences(id: string, lang: string, script: string): Promise<User | undefined> { this.db.prepare("UPDATE users SET preferred_language = ?, preferred_script = ? WHERE id = ?").run(lang, script, id); return this.getUser(id); }
    async getLeaderboard(): Promise<User[]> { const rows = this.db.prepare("SELECT * FROM users WHERE role != 'moderator' ORDER BY total_xp DESC LIMIT 20").all() as any[]; return rows.map(r => this.rowToUser(r)); }
    async getAllVerifiedWords(): Promise<Word[]> { const rows = this.db.prepare("SELECT * FROM words WHERE verified = 1").all() as any[]; return rows.map(r => this.rowToWord(r)); }
    async getWordsByCategory(category: string): Promise<Word[]> { const rows = this.db.prepare("SELECT * FROM words WHERE verified = 1 AND category = ?").all(category) as any[]; return rows.map(r => this.rowToWord(r)); }
    async getUnverifiedWords(): Promise<Word[]> { const rows = this.db.prepare("SELECT * FROM words WHERE verified = 0").all() as any[]; return rows.map(r => this.rowToWord(r)); }
    async getWordById(id: number): Promise<Word | undefined> { const row = this.db.prepare("SELECT * FROM words WHERE id = ?").get(id) as any; return row ? this.rowToWord(row) : undefined; }
    async createWord(insert: InsertWord): Promise<Word> { const now = new Date().toISOString(); const result = this.db.prepare(`INSERT INTO words (latin_pamiri, cyrillic_pamiri, english, russian, category, source, added_by_user_id, verified, upvotes_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`).run(insert.latinPamiri, insert.cyrillicPamiri || "", insert.english, insert.russian, insert.category, insert.source || "community", insert.addedByUserId || null, now); return (await this.getWordById(Number(result.lastInsertRowid)))!; }
    async approveWord(id: number): Promise<Word | undefined> { this.db.prepare("UPDATE words SET verified = 1 WHERE id = ?").run(id); return this.getWordById(id); }
    async rejectWord(id: number): Promise<boolean> { const result = this.db.prepare("DELETE FROM words WHERE id = ?").run(id); return result.changes > 0; }
    async getUnlockedWordsForUser(userId: string): Promise<Word[]> { const user = await this.getUser(userId); if (!user) return []; const allVerified = await this.getAllVerifiedWords(); return allVerified.filter(w => { const unlock = CATEGORY_UNLOCKS[w.category]; return unlock && user.level >= unlock.level; }); }
    async getCategoriesWithUnlockInfo(userId: string): Promise<Array<{ category: string; wordCount: number; unlocked: boolean; level: number; xpRequired: number }>> { const user = await this.getUser(userId); const rows = this.db.prepare("SELECT category, COUNT(*) as cnt FROM words WHERE verified = 1 GROUP BY category").all() as any[]; const categoryCounts: Record<string, number> = {}; for (const r of rows) { categoryCounts[r.category] = r.cnt; } return Object.entries(CATEGORY_UNLOCKS).map(([category, info]) => ({ category, wordCount: categoryCounts[category] || 0, unlocked: user ? user.level >= info.level : false, level: info.level, xpRequired: info.xpRequired })); }
    async getUserProgress(userId: string): Promise<UserProgress[]> { const rows = this.db.prepare("SELECT * FROM user_progress WHERE user_id = ?").all(userId) as any[]; return rows.map(r => this.rowToProgress(r)); }
    async getProgressForWord(userId: string, wordId: number): Promise<UserProgress | undefined> { const row = this.db.prepare("SELECT * FROM user_progress WHERE user_id = ? AND word_id = ?").get(userId, wordId) as any; return row ? this.rowToProgress(row) : undefined; }
    async recordAnswer(userId: string, wordId: number, correct: boolean): Promise<UserProgress> { const existing = await this.getProgressForWord(userId, wordId); const now = new Date().toISOString(); if (existing) { if (correct) { const newCorrect = existing.correctCount + 1; const newMastery = Math.min(5, Math.floor(newCorrect / 2)); this.db.prepare("UPDATE user_progress SET correct_count = ?, mastery_level = ?, last_reviewed_at = ? WHERE id = ?").run(newCorrect, newMastery, now, existing.id); } else { this.db.prepare("UPDATE user_progress SET incorrect_count = incorrect_count + 1, last_reviewed_at = ? WHERE id = ?").run(now, existing.id); } return (await this.getProgressForWord(userId, wordId))!; } const result = this.db.prepare(`INSERT INTO user_progress (user_id, word_id, correct_count, incorrect_count, mastery_level, last_reviewed_at) VALUES (?, ?, ?, ?, 0, ?)`).run(userId, wordId, correct ? 1 : 0, correct ? 0 : 1, now); const row = this.db.prepare("SELECT * FROM user_progress WHERE id = ?").get(Number(result.lastInsertRowid)) as any; return this.rowToProgress(row); }
    async createVote(vote: InsertVote): Promise<WordVote> { const now = new Date().toISOString(); const existing = this.db.prepare("SELECT * FROM word_votes WHERE word_id = ? AND user_id = ?").get(vote.wordId, vote.userId) as any; if (existing) { this.db.prepare("UPDATE word_votes SET vote_type = ? WHERE id = ?").run(vote.voteType, existing.id); this.recalcVotes(vote.wordId); const row = this.db.prepare("SELECT * FROM word_votes WHERE id = ?").get(existing.id) as any; return this.rowToVote(row); } const result = this.db.prepare(`INSERT INTO word_votes (word_id, user_id, vote_type, created_at) VALUES (?, ?, ?, ?)`).run(vote.wordId, vote.userId, vote.voteType, now); this.recalcVotes(vote.wordId); const row = this.db.prepare("SELECT * FROM word_votes WHERE id = ?").get(Number(result.lastInsertRowid)) as any; return this.rowToVote(row); }
    private recalcVotes(wordId: number) { const ups = (this.db.prepare("SELECT COUNT(*) as c FROM word_votes WHERE word_id = ? AND vote_type = 'up'").get(wordId) as any).c; const downs = (this.db.prepare("SELECT COUNT(*) as c FROM word_votes WHERE word_id = ? AND vote_type = 'down'").get(wordId) as any).c; this.db.prepare("UPDATE words SET upvotes_count = ? WHERE id = ?").run(ups - downs, wordId); }
    async getVotesForWord(wordId: number): Promise<WordVote[]> { const rows = this.db.prepare("SELECT * FROM word_votes WHERE word_id = ?").all(wordId) as any[]; return rows.map(r => this.rowToVote(r)); }
    async getPendingCommunityWords(userId: string): Promise<PendingWordReview[]> {
      const rows = this.db.prepare(`SELECT w.*, uv.vote_type AS user_vote, COALESCE(u.cnt, 0) AS up_votes, COALESCE(d.cnt, 0) AS down_votes FROM words w LEFT JOIN word_votes uv ON uv.word_id = w.id AND uv.user_id = ? LEFT JOIN (SELECT word_id, COUNT(*) AS cnt FROM word_votes WHERE vote_type = 'up' GROUP BY word_id) u ON u.word_id = w.id LEFT JOIN (SELECT word_id, COUNT(*) AS cnt FROM word_votes WHERE vote_type = 'down' GROUP BY word_id) d ON d.word_id = w.id WHERE w.verified = 0 AND w.source = 'community' AND (w.added_by_user_id IS NULL OR w.added_by_user_id != ?) AND uv.vote_type IS NULL ORDER BY w.created_at ASC`).all(userId, userId) as any[];
      return rows.map(r => ({ ...this.rowToWord(r), userVote: r.user_vote || null, upVotes: r.up_votes || 0, downVotes: r.down_votes || 0 }));
    }
    async createXpLog(entry: InsertXpLog): Promise<XpLog> { const now = new Date().toISOString(); const result = this.db.prepare(`INSERT INTO xp_logs (user_id, action_type, xp_earned, details, created_at) VALUES (?, ?, ?, ?, ?)`).run(entry.userId, entry.actionType, entry.xpEarned, entry.details || "", now); const row = this.db.prepare("SELECT * FROM xp_logs WHERE id = ?").get(Number(result.lastInsertRowid)) as any; return this.rowToXpLog(row); }
    async getXpLogForUser(userId: string): Promise<XpLog[]> { const rows = this.db.prepare("SELECT * FROM xp_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(userId) as any[]; return rows.map(r => this.rowToXpLog(r)); }
    async createBadge(badge: InsertBadge): Promise<Badge> { const now = new Date().toISOString(); this.db.prepare(`INSERT OR IGNORE INTO badges (user_id, badge_type, earned_at) VALUES (?, ?, ?)`).run(badge.userId, badge.badgeType, now); const row = this.db.prepare("SELECT * FROM badges WHERE user_id = ? AND badge_type = ?").get(badge.userId, badge.badgeType) as any; return this.rowToBadge(row); }
    async getBadgesForUser(userId: string): Promise<Badge[]> { const rows = this.db.prepare("SELECT * FROM badges WHERE user_id = ?").all(userId) as any[]; return rows.map(r => this.rowToBadge(r)); }
    async hasBadge(userId: string, badgeType: string): Promise<boolean> { const row = this.db.prepare("SELECT 1 FROM badges WHERE user_id = ? AND badge_type = ?").get(userId, badgeType); return !!row; }
    async getAllUsers(): Promise<User[]> { const rows = this.db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as any[]; return rows.map(r => this.rowToUser(r)); }
    async deleteUser(id: string): Promise<boolean> { this.db.prepare("DELETE FROM user_progress WHERE user_id = ?").run(id); this.db.prepare("DELETE FROM word_votes WHERE user_id = ?").run(id); this.db.prepare("DELETE FROM xp_logs WHERE user_id = ?").run(id); this.db.prepare("DELETE FROM badges WHERE user_id = ?").run(id); const result = this.db.prepare("DELETE FROM users WHERE id = ?").run(id); return result.changes > 0; }
    async getAllWords(): Promise<Word[]> { const rows = this.db.prepare("SELECT * FROM words ORDER BY created_at DESC").all() as any[]; return rows.map(r => this.rowToWord(r)); }
    async deleteWord(id: number): Promise<boolean> { this.db.prepare("DELETE FROM user_progress WHERE word_id = ?").run(id); this.db.prepare("DELETE FROM word_votes WHERE word_id = ?").run(id); const result = this.db.prepare("DELETE FROM words WHERE id = ?").run(id); return result.changes > 0; }
    async createNews(news: InsertNews): Promise<NewsItem> { const now = new Date().toISOString(); const result = this.db.prepare(`INSERT INTO news (title, content, author_id, created_at) VALUES (?, ?, ?, ?)`).run(news.title, news.content, news.authorId, now); const row = this.db.prepare("SELECT * FROM news WHERE id = ?").get(Number(result.lastInsertRowid)) as any; return this.rowToNews(row); }
    async getAllNews(): Promise<NewsItem[]> { const rows = this.db.prepare("SELECT * FROM news ORDER BY created_at DESC").all() as any[]; return rows.map(r => this.rowToNews(r)); }
    async deleteNews(id: number): Promise<boolean> { const result = this.db.prepare("DELETE FROM news WHERE id = ?").run(id); return result.changes > 0; }
  }

  storage = new SqliteStorage();
}

export { storage };
