import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, X, Shield, Users, BookOpen, Megaphone, Trash2, Plus, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { CreatedByAttribution } from "@/components/CreatedByAttribution";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Word, User, NewsItem } from "@shared/schema";

type Tab = "words" | "users" | "news";

export default function ModPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("words");

  if (!user || user.role !== "moderator") {
    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto text-center py-20">
        <p className="text-muted-foreground">Доступ запрещён</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "words", label: "Слова", icon: BookOpen },
    { id: "users", label: "Пользователи", icon: Users },
    { id: "news", label: "Новости", icon: Megaphone },
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

      {activeTab === "words" && <WordsTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "news" && <NewsTab userId={user.id} />}

      <CreatedByAttribution />
    </div>
  );
}

/* ===== WORDS TAB ===== */
function WordsTab() {
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data: pendingWords, isLoading: pendingLoading } = useQuery<Word[]>({
    queryKey: ["/api/words/pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/words/pending");
      return res.json();
    },
  });

  const { data: allWords, isLoading: allLoading } = useQuery<Word[]>({
    queryKey: ["/api/admin/words"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/words");
      return res.json();
    },
    enabled: filter === "all",
  });

  const approveMutation = useMutation({
    mutationFn: async (wordId: number) => {
      const res = await apiRequest("POST", `/api/words/${wordId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/words/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (wordId: number) => {
      const res = await apiRequest("POST", `/api/words/${wordId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/words/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/words"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (wordId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/words/${wordId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/words/pending"] });
    },
  });

  const isLoading = filter === "pending" ? pendingLoading : allLoading;
  const words = filter === "pending" ? pendingWords : allWords;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
          className="text-xs"
        >
          На проверке {pendingWords ? `(${pendingWords.length})` : ""}
        </Button>
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className="text-xs"
        >
          Все слова {allWords ? `(${allWords.length})` : ""}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : !words || words.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {filter === "pending" ? "Нет слов для проверки" : "Нет слов"}
        </div>
      ) : (
        <div className="space-y-2">
          {words.map(word => (
            <Card key={word.id} data-testid={`word-${word.id}`}>
              <CardContent className="pt-3 pb-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold truncate">{word.latinPamiri}</p>
                      {word.cyrillicPamiri && (
                        <span className="text-xs text-muted-foreground">/ {word.cyrillicPamiri}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="truncate"><span className="text-muted-foreground">EN: </span>{word.english}</div>
                      <div className="truncate"><span className="text-muted-foreground">RU: </span>{word.russian}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {word.verified ? (
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">✓</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Ожидает</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">{word.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{word.source}</span>
                  </div>
                  <div className="flex gap-1">
                    {!word.verified && filter === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => approveMutation.mutate(word.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`approve-${word.id}`}
                        >
                          <Check size={12} className="mr-0.5" /> Да
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => rejectMutation.mutate(word.id)}
                          disabled={rejectMutation.isPending}
                          data-testid={`reject-${word.id}`}
                        >
                          <X size={12} className="mr-0.5" /> Нет
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Удалить это слово?")) {
                          deleteMutation.mutate(word.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid={`delete-word-${word.id}`}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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

/* ===== NEWS TAB ===== */
function NewsTab({ userId }: { userId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: news, isLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/news");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/news", {
        title: title.trim(),
        content: content.trim(),
        authorId: userId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setTitle("");
      setContent("");
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (newsId: number) => {
      const res = await apiRequest("DELETE", `/api/news/${newsId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
  });

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-full"
          data-testid="button-add-news"
        >
          <Plus size={14} className="mr-1" /> Добавить новость
        </Button>
      ) : (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <Input
              placeholder="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-news-title"
            />
            <Textarea
              placeholder="Текст новости..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              data-testid="input-news-content"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => createMutation.mutate()}
                disabled={!title.trim() || !content.trim() || createMutation.isPending}
                data-testid="button-submit-news"
              >
                Опубликовать
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => { setShowForm(false); setTitle(""); setContent(""); }}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : !news || news.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Нет новостей
        </div>
      ) : (
        <div className="space-y-2">
          {news.map(item => (
            <Card key={item.id} data-testid={`news-${item.id}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{item.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(item.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive shrink-0"
                    onClick={() => {
                      if (confirm("Удалить эту новость?")) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    data-testid={`delete-news-${item.id}`}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
