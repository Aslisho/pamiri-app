import { useQuery } from "@tanstack/react-query";
import { Trophy, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const TROPHY_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export default function RanksPage() {
  const { user } = useUser();
  const { t } = useLanguage();

  const { data: leaderboard, isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/leaderboard");
      return res.json();
    },
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-4">
      <div className="pt-4 text-center">
        <h2 className="text-lg font-bold" data-testid="text-ranks-title">
          {t("ranks.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("ranks.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : !leaderboard || leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {t("ranks.noParticipants")}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((u, index) => {
            const isCurrentUser = u.id === user.id;
            return (
              <Card
                key={u.id}
                className={`${isCurrentUser ? "border-primary/40 bg-primary/5" : ""}`}
                data-testid={`rank-${index + 1}`}
              >
                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {index < 3 ? (
                      <Trophy size={20} className={TROPHY_COLORS[index]} />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + Level + Streak */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {u.displayName}
                      {isCurrentUser && (
                        <span className="text-xs text-primary ml-1">
                          {t("ranks.you")}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t("ranks.level")} {u.level}</span>
                      {u.currentStreak > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-500 font-medium">
                          <Flame size={11} />
                          {u.currentStreak} {t("ranks.days")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{u.totalXp}</p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
