import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Flame, BookOpen, Globe, ChevronRight, Zap, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getXpForNextLevel, getXpForLevel, CATEGORY_RU, type Word } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { cap } from "@/lib/utils";

const DAILY_XP_GOAL = 50;

// Circular progress ring
function XpRing({ current, total }: { current: number; total: number }) {
  const pct = Math.min(1, current / total);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        className="text-primary transition-all duration-700"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [flipped, setFlipped] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/users", user?.id, "stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${user!.id}/stats`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/words/categories", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/words/categories/${user!.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: unlockedWords } = useQuery<Word[]>({
    queryKey: ["/api/words/unlocked", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/words/unlocked/${user!.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const wordOfTheDay = unlockedWords && unlockedWords.length > 0
    ? unlockedWords[Math.floor(new Date().getDate() * 7 + new Date().getMonth() * 31) % unlockedWords.length]
    : null;

  if (!user) return null;

  const totalXp = stats?.totalXp || user.totalXp;
  const currentLevel = stats?.level || user.level;
  const xpForCurrent = getXpForLevel(currentLevel);
  const xpForNext = getXpForNextLevel(currentLevel);
  const levelPct = xpForNext > xpForCurrent
    ? ((totalXp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100
    : 100;

  // Today's XP earned — approximate from streak/total (treat as daily goal tracker)
  const todayXp = Math.min(DAILY_XP_GOAL, (totalXp % DAILY_XP_GOAL) || DAILY_XP_GOAL);
  const dailyDone = todayXp >= DAILY_XP_GOAL;

  const script = user.preferredScript;

  // Next recommended category
  const nextCategory = categories?.find((c: any) => c.unlocked && c.wordCount >= 4);
  const nextLocked = categories?.find((c: any) => !c.unlocked);

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-4">
      {/* Welcome */}
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" data-testid="text-welcome">
            {t("home.welcome")}, {user.displayName}!
          </h2>
          <p className="text-sm text-muted-foreground">{t("home.subtitle")}</p>
        </div>
        {/* Streak badge */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
            <Flame size={16} className="text-orange-500" />
            <span className="text-sm font-bold text-orange-500" data-testid="text-streak">
              {stats?.currentStreak || user.currentStreak}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{t("home.streak")}</span>
        </div>
      </div>

      {/* Next Lesson — hero CTA */}
      {nextCategory && (
        <Link href="/learn">
          <div
            className="rounded-2xl bg-gradient-to-br from-primary/90 to-violet-600 p-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-primary/20"
            data-testid="next-lesson-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  {t("home.nextLesson")}
                </p>
                <p className="text-xl font-bold text-white leading-tight">
                  {CATEGORY_RU[nextCategory.category] || nextCategory.category}
                </p>
                <p className="text-sm text-white/70 mt-0.5">
                  {nextCategory.wordCount} {t("learn.words")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ChevronRight size={22} className="text-white" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Stats row: Level ring + Words + Rank */}
      <div className="grid grid-cols-3 gap-3">
        {/* Level + XP ring */}
        <Card>
          <CardContent className="pt-3 pb-3 flex flex-col items-center gap-1">
            <div className="relative">
              <XpRing current={levelPct} total={100} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold">{currentLevel}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("home.level")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BookOpen size={14} className="text-primary" />
              <span className="text-lg font-bold" data-testid="text-words-learned">
                {stats?.wordsLearned || 0}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("home.learned")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-lg font-bold" data-testid="text-rank">
                #{stats?.globalRank || "—"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("home.rank")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily goal bar */}
      <Card className={dailyDone ? "border-primary/40" : ""}>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <Zap size={18} className={dailyDone ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium">{t("home.dailyGoal")}</span>
                <span className="text-xs text-muted-foreground">{Math.min(todayXp, DAILY_XP_GOAL)}/{DAILY_XP_GOAL} XP</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.min(100, (todayXp / DAILY_XP_GOAL) * 100)}%` }}
                  data-testid="xp-progress"
                />
              </div>
            </div>
            {dailyDone && (
              <span className="text-xs font-semibold text-primary shrink-0">✓</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Word of the Day */}
      {wordOfTheDay && (
        <Card
          className="cursor-pointer overflow-hidden border-l-4 border-l-primary"
          onClick={() => setFlipped(!flipped)}
          data-testid="word-of-day"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("home.wordOfDay")}
              </span>
            </div>
            <div className="text-center py-2 min-h-[60px] flex flex-col items-center justify-center">
              {!flipped ? (
                <>
                  <p className="text-2xl font-bold">
                    {cap(script === "cyrillic" && wordOfTheDay.cyrillicPamiri
                      ? wordOfTheDay.cyrillicPamiri
                      : wordOfTheDay.latinPamiri)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t("home.tapToFlip")}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-primary">
                    {cap(wordOfTheDay.russian)} / {cap(wordOfTheDay.english)}
                  </p>
                  {wordOfTheDay.tajik && (
                    <p className="text-sm text-muted-foreground mt-0.5">{wordOfTheDay.tajik}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {cap(script === "cyrillic" && wordOfTheDay.cyrillicPamiri
                      ? wordOfTheDay.cyrillicPamiri
                      : wordOfTheDay.latinPamiri)}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teaser: next locked level */}
      {nextLocked && (
        <div className="flex items-center gap-2 px-1 py-0.5">
          <Lock size={12} className="text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground/60">
            {t("home.nextUnlock")}{" "}
            <span className="font-medium">{CATEGORY_RU[nextLocked.category] || nextLocked.category}</span>
            {" "}{t("home.atLevel")} {nextLocked.level}
          </p>
        </div>
      )}
    </div>
  );
}
