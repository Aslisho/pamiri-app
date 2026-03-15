import { useQuery } from "@tanstack/react-query";
import { Flame, BookOpen, Star, Trophy, Award, Zap, Shield, Target, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Badge as BadgeType, XpLog } from "@shared/schema";

const LEVEL_TITLES: Record<string, string> = {
  "1": "Начинающий",
  "2": "Ученик", "3": "Ученик", "4": "Ученик",
  "5": "Говорящий", "6": "Говорящий", "7": "Говорящий",
  "8": "Участник", "9": "Участник", "10": "Участник",
  "11": "Знаток", "12": "Знаток", "13": "Знаток", "14": "Знаток",
  "15": "Мастер", "16": "Мастер",
  "17": "Хранитель Шугнанского",
};

const BADGE_INFO: Record<string, { label: string; icon: typeof Star; description: string }> = {
  first_word: { label: "Первое слово", icon: Star, description: "Завершите первый урок" },
  word_warrior: { label: "Боец слов", icon: Target, description: "Добавьте 10 слов" },
  streak_master: { label: "Мастер серий", icon: Flame, description: "Серия 7 дней" },
  top_contributor: { label: "Лучший автор", icon: Award, description: "50 одобренных слов" },
  scholar: { label: "Учёный", icon: BookOpen, description: "Освойте 100 слов" },
  perfectionist: { label: "Перфекционист", icon: Medal, description: "5 идеальных тестов" },
};

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${user!.id}/stats`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: badges } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/badges/${user!.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: xpLog } = useQuery<XpLog[]>({
    queryKey: ["/api/xp-log", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/xp-log/${user!.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  if (!user) return null;

  const levelTitle = LEVEL_TITLES[String(user.level)] || "Хранитель Шугнанского";
  const earnedBadgeTypes = (badges || []).map(b => b.badgeType);

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-5">
      {/* Avatar + Name */}
      <div className="pt-4 text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <h2 className="text-lg font-bold" data-testid="text-profile-name">{user.displayName}</h2>
        <p className="text-sm text-muted-foreground">
          {t("profile.level")} {user.level} — {levelTitle}
        </p>
        {user.role === "moderator" && (
          <Badge variant="secondary" className="text-xs">
            <Shield size={12} className="mr-1" /> {t("profile.moderator")}
          </Badge>
        )}
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("profile.totalXp"), value: stats?.totalXp || user.totalXp, icon: Zap },
            { label: t("profile.streak"), value: stats?.currentStreak || user.currentStreak, icon: Flame },
            { label: t("profile.maxStreak"), value: stats?.longestStreak || user.longestStreak, icon: Trophy },
            { label: t("profile.learned"), value: stats?.wordsLearned || 0, icon: BookOpen },
            { label: t("profile.contributed"), value: stats?.wordsContributed || 0, icon: Award },
            { label: t("profile.rank"), value: `#${stats?.globalRank || "—"}`, icon: Medal },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i}>
                <CardContent className="pt-3 pb-3 text-center">
                  <Icon size={14} className="mx-auto mb-1 text-primary" />
                  <p className="text-base font-bold" data-testid={`stat-${i}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{t("profile.badges")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(BADGE_INFO).map(([type, info]) => {
            const earned = earnedBadgeTypes.includes(type);
            const Icon = info.icon;
            return (
              <Card
                key={type}
                className={`${earned ? "" : "opacity-40"}`}
                data-testid={`badge-${type}`}
              >
                <CardContent className="pt-3 pb-3 text-center">
                  <Icon size={20} className={`mx-auto mb-1 ${earned ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-[10px] font-medium leading-tight">{info.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* XP Log */}
      {xpLog && xpLog.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">
            {t("profile.recentActions")}
          </h3>
          <Card>
            <CardContent className="pt-3 pb-3 space-y-2">
              {xpLog.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate flex-1 mr-2">{entry.details}</span>
                  <span className="font-medium text-primary shrink-0">+{entry.xpEarned} XP</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logout */}
      <Button
        variant="secondary"
        className="w-full"
        onClick={handleLogout}
        data-testid="button-logout"
      >
        {t("profile.logout")}
      </Button>

    </div>
  );
}
