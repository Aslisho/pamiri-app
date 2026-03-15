import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Lock, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { CreatedByAttribution } from "@/components/CreatedByAttribution";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CATEGORY_UNLOCKS, CATEGORY_RU, type Word } from "@shared/schema";

export default function DictionaryPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedWord, setExpandedWord] = useState<number | null>(null);

  const { data: allWords, isLoading } = useQuery<Word[]>({
    queryKey: ["/api/words"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/words");
      return res.json();
    },
    enabled: !!user,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ wordId, voteType }: { wordId: number; voteType: string }) => {
      const res = await apiRequest("POST", `/api/words/${wordId}/vote`, {
        userId: user!.id,
        voteType,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
    },
  });

  const script = user?.preferredScript || "latin";
  const categories = Object.keys(CATEGORY_UNLOCKS);

  const filteredWords = (allWords || []).filter(w => {
    const matchesSearch = !searchTerm || 
      w.latinPamiri.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.russian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.cyrillicPamiri && w.cyrillicPamiri.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isUnlocked = (word: Word) => {
    if (!user) return false;
    const unlock = CATEGORY_UNLOCKS[word.category];
    return unlock ? user.level >= unlock.level : false;
  };

  if (!user) return null;

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-4">
      <div className="pt-4">
        <h2 className="text-lg font-bold" data-testid="text-dictionary-title">
          Словарь
        </h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="input-search"
          placeholder="Поиск..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="h-10 pl-9"
        />
      </div>

      {/* Category filter */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "secondary"}
            size="sm"
            className="h-7 text-xs rounded-full shrink-0"
            onClick={() => setSelectedCategory(null)}
            data-testid="filter-all"
          >
            Все
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              size="sm"
              className="h-7 text-xs rounded-full shrink-0"
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              data-testid={`filter-${cat.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {CATEGORY_RU[cat] || cat}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Word list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Слова не найдены
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWords.map(word => {
            const unlocked = isUnlocked(word);
            const isExpanded = expandedWord === word.id;

            if (!unlocked) {
              return (
                <Card key={word.id} className="opacity-50" data-testid={`word-locked-${word.id}`}>
                  <CardContent className="pt-3 pb-3 flex items-center gap-3">
                    <Lock size={16} className="text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium blur-[3px] select-none">
                        {word.latinPamiri}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Нужен уровень {CATEGORY_UNLOCKS[word.category]?.level}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card
                key={word.id}
                className="cursor-pointer transition-all hover:border-primary/30"
                onClick={() => setExpandedWord(isExpanded ? null : word.id)}
                data-testid={`word-${word.id}`}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {script === "cyrillic" && word.cyrillicPamiri
                          ? word.cyrillicPamiri
                          : word.latinPamiri}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {word.russian} / {word.english}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {CATEGORY_RU[word.category] || word.category}
                      </Badge>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Латиница: </span>
                          <span className="font-medium">{word.latinPamiri}</span>
                        </div>
                        {word.cyrillicPamiri && (
                          <div>
                            <span className="text-muted-foreground">Кириллица: </span>
                            <span className="font-medium">{word.cyrillicPamiri}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">EN: </span>
                          <span>{word.english}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">RU: </span>
                          <span>{word.russian}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Источник: {word.source === "community" ? "сообщество" : word.source === "zarubin" ? "Зарубин" : "словарь"}</span>
                        {word.source === "community" && (
                          <div className="flex items-center gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                voteMutation.mutate({ wordId: word.id, voteType: "up" });
                              }}
                              data-testid={`vote-up-${word.id}`}
                            >
                              <ThumbsUp size={12} />
                            </Button>
                            <span>{word.upvotesCount}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                voteMutation.mutate({ wordId: word.id, voteType: "down" });
                              }}
                              data-testid={`vote-down-${word.id}`}
                            >
                              <ThumbsDown size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreatedByAttribution />
    </div>
  );
}
