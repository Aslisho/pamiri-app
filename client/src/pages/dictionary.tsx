import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Lock, ChevronDown, ChevronUp, Edit3, ThumbsUp, ThumbsDown, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CATEGORY_UNLOCKS, CATEGORY_RU, type Word, type WordSuggestion } from "@shared/schema";

export default function DictionaryPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedWord, setExpandedWord] = useState<number | null>(null);
  const [suggestingFor, setSuggestingFor] = useState<number | null>(null);

  const { data: allWords, isLoading } = useQuery<Word[]>({
    queryKey: ["/api/words"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/words");
      return res.json();
    },
    enabled: !!user,
  });

  const script = user?.preferredScript || "latin";
  const categories = Object.keys(CATEGORY_UNLOCKS);

  const isUnlocked = (word: Word) => {
    if (!user) return false;
    const unlock = CATEGORY_UNLOCKS[word.category];
    return unlock ? user.level >= unlock.level : false;
  };

  // Filter words
  const filteredWords = (allWords || []).filter(w => {
    const matchesSearch = !searchTerm ||
      w.latinPamiri.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.russian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.cyrillicPamiri && w.cyrillicPamiri.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort: unlocked first (by category level asc, then alphabetically), then locked
  const sortedWords = [...filteredWords].sort((a, b) => {
    const aUnlocked = isUnlocked(a);
    const bUnlocked = isUnlocked(b);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    // Within same group, sort by category level
    const aLevel = CATEGORY_UNLOCKS[a.category]?.level ?? 99;
    const bLevel = CATEGORY_UNLOCKS[b.category]?.level ?? 99;
    if (aLevel !== bLevel) return aLevel - bLevel;
    // Then alphabetically
    return a.latinPamiri.localeCompare(b.latinPamiri);
  });

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
      ) : sortedWords.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Слова не найдены
        </div>
      ) : (
        <div className="space-y-2">
          {sortedWords.map(word => {
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
                onClick={() => {
                  setExpandedWord(isExpanded ? null : word.id);
                  if (isExpanded) setSuggestingFor(null);
                }}
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
                    <div className="mt-3 pt-3 border-t border-border space-y-3" onClick={e => e.stopPropagation()}>
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
                      </div>

                      {/* Suggest correction button */}
                      {suggestingFor !== word.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs gap-1"
                          onClick={() => setSuggestingFor(word.id)}
                        >
                          <Edit3 size={12} /> Предложить исправление
                        </Button>
                      ) : (
                        <SuggestionForm word={word} userId={user.id} onClose={() => setSuggestingFor(null)} />
                      )}

                      {/* Existing suggestions */}
                      <SuggestionsList wordId={word.id} userId={user.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}

/* ===== SUGGESTION FORM ===== */
function SuggestionForm({ word, userId, onClose }: { word: Word; userId: string; onClose: () => void }) {
  const [latin, setLatin] = useState(word.latinPamiri);
  const [cyrillic, setCyrillic] = useState(word.cyrillicPamiri);
  const [english, setEnglish] = useState(word.english);
  const [russian, setRussian] = useState(word.russian);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/words/${word.id}/suggest`, {
        userId,
        latinPamiri: latin.trim(),
        cyrillicPamiri: cyrillic.trim(),
        english: english.trim(),
        russian: russian.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/words", word.id, "suggestions"] });
      setTimeout(() => onClose(), 1500);
    },
  });

  const hasChanges =
    latin.trim() !== word.latinPamiri ||
    cyrillic.trim() !== word.cyrillicPamiri ||
    english.trim() !== word.english ||
    russian.trim() !== word.russian;

  if (submitted) {
    return (
      <div className="text-center py-2 text-xs text-green-600 font-medium">
        Исправление отправлено! +5 XP
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-muted/50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Ваш вариант:</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X size={12} />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Латиница"
          value={latin}
          onChange={e => setLatin(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Кириллица"
          value={cyrillic}
          onChange={e => setCyrillic(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="English"
          value={english}
          onChange={e => setEnglish(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Русский"
          value={russian}
          onChange={e => setRussian(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <Button
        size="sm"
        className="w-full h-8 text-xs gap-1"
        disabled={!hasChanges || !latin.trim() || !english.trim() || !russian.trim() || submitMutation.isPending}
        onClick={() => submitMutation.mutate()}
      >
        <Send size={12} /> Отправить
      </Button>
    </div>
  );
}

/* ===== SUGGESTIONS LIST ===== */
function SuggestionsList({ wordId, userId }: { wordId: number; userId: string }) {
  const { data: suggestions } = useQuery<WordSuggestion[]>({
    queryKey: ["/api/words", wordId, "suggestions"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/words/${wordId}/suggestions`);
      return res.json();
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ suggestionId, voteType }: { suggestionId: number; voteType: string }) => {
      const res = await apiRequest("POST", `/api/suggestions/${suggestionId}/vote`, {
        userId,
        voteType,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/words", wordId, "suggestions"] });
    },
  });

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        Предложения ({suggestions.length})
      </span>
      {suggestions.map(s => (
        <div key={s.id} className="flex items-center gap-2 bg-muted/40 rounded-md p-2">
          <div className="flex-1 min-w-0 text-xs">
            <span className="font-medium">{s.latinPamiri}</span>
            <span className="text-muted-foreground"> — {s.russian} / {s.english}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => voteMutation.mutate({ suggestionId: s.id, voteType: "up" })}
              disabled={s.userId === userId}
            >
              <ThumbsUp size={11} />
            </Button>
            <span className={`text-[10px] font-bold min-w-[16px] text-center ${
              s.upvotesCount > 0 ? "text-green-600" : s.upvotesCount < 0 ? "text-red-600" : "text-muted-foreground"
            }`}>
              {s.upvotesCount > 0 ? `+${s.upvotesCount}` : s.upvotesCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => voteMutation.mutate({ suggestionId: s.id, voteType: "down" })}
              disabled={s.userId === userId}
            >
              <ThumbsDown size={11} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
