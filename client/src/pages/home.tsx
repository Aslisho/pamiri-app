import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Flame, BookOpen, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/contexts/UserContext";
import { getXpForNextLevel, getXpForLevel, type Word } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function HomePage() {
  const { user } = useUser();
  const [flipped, setFlipped] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${user!.id}/stats`);
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

  // Word of the day based on date seed
  const wordOfTheDay = unlockedWords && unlockedWords.length > 0
    ? unlockedWords[Math.floor(new Date().getDate() * 7 + new Date().getMonth() * 31) % unlockedWords.length]
    : null;

  if (!user) return null;

  const xpForCurrent = getXpForLevel(user.level);
  const xpForNext = getXpForNextLevel(user.level);
  const xpProgress = xpForNext > xpForCurrent
    ? ((stats?.totalXp || user.totalXp) - xpForCurrent) / (xpForNext - xpForCurrent) * 100
    : 100;

  const script = user.preferredScript;

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-5">
      {/* Welcome */}
      <div className="pt-4">
        <h2 className="text-lg font-bold" data-testid="text-welcome">
          Добро пожаловать, {user.displayName}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Давайте учить шугнанский
        </p>
      </div>

      {/* XP Progress */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Уровень {stats?.level || user.level}
            </span>
            <span className="text-xs font-medium text-primary">
              {stats?.totalXp || user.totalXp} XP
            </span>
          </div>
          <Progress value={xpProgress} className="h-2" data-testid="xp-progress" />
          <div className="text-[10px] text-muted-foreground text-right">
            {xpForNext - (stats?.totalXp || user.totalXp)} XP до уровня {Math.min(17, user.level + 1)}
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame size={14} className="text-orange-500" />
              <span className="text-lg font-bold" data-testid="text-streak">
                {stats?.currentStreak || user.currentStreak}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Серия дней</p>
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
            <p className="text-[10px] text-muted-foreground">Изучено</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Globe size={14} className="text-accent-foreground" />
              <span className="text-lg font-bold" data-testid="text-rank">
                #{stats?.globalRank || "—"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Ранг</p>
          </CardContent>
        </Card>
      </div>

      {/* Word of the Day */}
      {wordOfTheDay && (
        <Card
          className="cursor-pointer overflow-hidden"
          onClick={() => setFlipped(!flipped)}
          data-testid="word-of-day"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Слово дня
              </span>
            </div>
            <div className="text-center py-3 min-h-[64px] flex flex-col items-center justify-center">
              {!flipped ? (
                <>
                  <p className="text-xl font-bold">
                    {script === "cyrillic" && wordOfTheDay.cyrillicPamiri
                      ? wordOfTheDay.cyrillicPamiri
                      : wordOfTheDay.latinPamiri}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Нажмите, чтобы увидеть перевод</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-primary">
                    {wordOfTheDay.russian} / {wordOfTheDay.english}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {script === "cyrillic" && wordOfTheDay.cyrillicPamiri
                      ? wordOfTheDay.cyrillicPamiri
                      : wordOfTheDay.latinPamiri}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Lesson CTA */}
      <Link href="/learn">
        <Button
          className="w-full h-14 text-base font-semibold rounded-xl"
          data-testid="button-start-lesson"
        >
          Начать урок
        </Button>
      </Link>

    </div>
  );
}
