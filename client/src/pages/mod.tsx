import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, X, Shield, Users, BookOpen, Edit3, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cap } from "@/lib/utils";
import { ReviewQueue } from "@/pages/add";
import type { Word, User, WordSuggestion } from "@shared/schema";

type Tab = "review" | "suggestions" | "users";

export default function ModPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("review");

  if (!user || user.role !== "moderator") {
    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto text-center py-20">
        <p className="text-muted-foreground">Доступ запрещён</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "review", label: "Слова", icon: BookOpen },
    { id: "suggestions", label: "Исправления", icon: Edit3 },
    { id: "users", label: "Юзеры", icon: Users },
  ];

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-4">
      <div className="pt-4 flex items-center gap-2">
        <Shield size={20} className="text-primary" />
        <h2 className="text-lg font-bold" data-testid="text-mod-title">Панель модератора</h2>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "review" && <ReviewQueue user={user} isModerator={true} />}
      {activeTab === "suggestions" && <SuggestionsTab />}
      {activeTab === "users" && <UsersTab />}
    </div>
  );
}

/* ===== SUGGESTIONS TAB ===== */
function SuggestionsTab() {
  const { data: suggestions, isLoading } = useQuery<(WordSuggestion & { originalWord?: Word })[]>({
    queryKey: ["/api/admin/suggestions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/suggestions");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      const res = await apiRequest("POST", `/api/suggestions/${suggestionId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/words"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      const res = await apiRequest("POST", `/api/suggestions/${suggestionId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suggestions"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Нет предложенных исправлений
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {suggestions.length} исправлений ожидают проверки
      </div>
      {suggestions.map(s => {
        const orig = s.originalWord;
        const changed = orig ? {
          latin: s.latinPamiri !== orig.latinPamiri,
          cyrillic: s.cyrillicPamiri !== orig.cyrillicPamiri,
          english: s.english !== orig.english,
          russian: s.russian !== orig.russian,
          tajik: (s.tajik || "") !== (orig.tajik || ""),
        } : { latin: false, cyrillic: false, english: false, russian: false, tajik: false };

        return (
          <Card key={s.id}>
            <CardContent className="pt-3 pb-3 space-y-2">
              {/* Original word */}
              {orig && (
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Текущее:</span>
                  <div className="text-xs grid grid-cols-2 gap-1">
                    <div className={changed.latin ? "line-through text-muted-foreground" : ""}>
                      <span className="text-muted-foreground">Лат: </span>{cap(orig.latinPamiri)}
                    </div>
                    <div className={changed.cyrillic ? "line-through text-muted-foreground" : ""}>
                      <span className="text-muted-foreground">Кир: </span>{orig.cyrillicPamiri ? cap(orig.cyrillicPamiri) : "—"}
                    </div>
                    <div className={changed.english ? "line-through text-muted-foreground" : ""}>
                      <span className="text-muted-foreground">EN: </span>{cap(orig.english)}
                    </div>
                    <div className={changed.russian ? "line-through text-muted-foreground" : ""}>
                      <span className="text-muted-foreground">RU: </span>{cap(orig.russian)}
                    </div>
                    {(orig.tajik || s.tajik) && (
                      <div className={changed.tajik ? "line-through text-muted-foreground col-span-2" : "col-span-2"}>
                        <span className="text-muted-foreground">TG: </span>{orig.tajik ? cap(orig.tajik) : "—"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suggested changes */}
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Предложение:</span>
                <div className="text-xs grid grid-cols-2 gap-1">
                  <div className={changed.latin ? "font-bold text-green-700 dark:text-green-400" : ""}>
                    <span className="text-muted-foreground">Лат: </span>{cap(s.latinPamiri)}
                  </div>
                  <div className={changed.cyrillic ? "font-bold text-green-700 dark:text-green-400" : ""}>
                    <span className="text-muted-foreground">Кир: </span>{s.cyrillicPamiri ? cap(s.cyrillicPamiri) : "—"}
                  </div>
                  <div className={changed.english ? "font-bold text-green-700 dark:text-green-400" : ""}>
                    <span className="text-muted-foreground">EN: </span>{cap(s.english)}
                  </div>
                  <div className={changed.russian ? "font-bold text-green-700 dark:text-green-400" : ""}>
                    <span className="text-muted-foreground">RU: </span>{cap(s.russian)}
                  </div>
                  {(s.tajik || (s.originalWord?.tajik)) && (
                    <div className={`col-span-2 ${changed.tajik ? "font-bold text-green-700 dark:text-green-400" : ""}`}>
                      <span className="text-muted-foreground">TG: </span>{s.tajik ? cap(s.tajik) : "—"}
                    </div>
                  )}
                </div>
              </div>

              {/* Vote count + actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {orig && (
                    <Badge variant="outline" className="text-[10px]">{orig.category}</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => approveMutation.mutate(s.id)}
                    disabled={approveMutation.isPending}
                  >
                    <Check size={12} className="mr-0.5" /> Принять
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => rejectMutation.mutate(s.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <X size={12} className="mr-0.5" /> Отклонить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ===== USERS TAB ===== */
function UsersTab() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Нет пользователей
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-1">
        Всего: {users.length} пользователей
      </div>
      {users.map(u => (
        <Card key={u.id} data-testid={`user-${u.id}`}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{u.username}</p>
                  {u.role === "moderator" && (
                    <Badge variant="secondary" className="text-[10px]">Модератор</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span>Ур. {u.level}</span>
                  <span>{u.totalXp} XP</span>
                  <span>Серия: {u.currentStreak}</span>
                  <span>{new Date(u.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>
              {u.role !== "moderator" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:text-destructive shrink-0"
                  onClick={() => {
                    if (confirm(`Удалить пользователя "${u.username}"? Все данные будут потеряны.`)) {
                      deleteMutation.mutate(u.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  data-testid={`delete-user-${u.id}`}
                >
                  <UserX size={14} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
