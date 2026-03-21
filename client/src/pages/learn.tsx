import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lock, CheckCircle, XCircle, ChevronLeft, Shuffle, Play, Flame, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cap } from "@/lib/utils";
import { getCategoryName, type QuizQuestion, type Word } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

type View = "categories" | "flashcard" | "quiz" | "match" | "results";

export default function LearnPage() {
  const { user, setUser } = useUser();
  const { t, lang } = useLanguage();
  const [view, setView]   = useState<View>("categories");
  const [gameMode, setGameMode] = useState<"quiz" | "match">("quiz");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [wordFlipped, setWordFlipped] = useState(false);

  // ── Quiz state ──────────────────────────────────────────────────
  const [questions, setQuestions]       = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ]         = useState(0);
  const [score, setScore]               = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizResult, setQuizResult]     = useState<any>(null);

  // ── Match state ──────────────────────────────────────────────────
  const [matchWords, setMatchWords]     = useState<Word[]>([]);
  const [matchRound, setMatchRound]     = useState(0);
  const [rightOrder, setRightOrder]     = useState<number[]>([]); // shuffled word IDs for right column
  const [selectedLeft, setSelectedLeft]   = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedIds, setMatchedIds]     = useState<Set<number>>(new Set());
  const [wrongPairIds, setWrongPairIds] = useState<Set<number>>(new Set());
  const [matchScore, setMatchScore]     = useState(0);
  const [matchLocked, setMatchLocked]   = useState(false);

  // ── Flashcard state ───────────────────────────────────────────────
  const [flashcardWords, setFlashcardWords] = useState<Word[]>([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [pendingMode, setPendingMode] = useState<"quiz" | "match">("quiz");

  // ── Shared results state ─────────────────────────────────────────
  const [resultScore, setResultScore] = useState(0);
  const [resultTotal, setResultTotal] = useState(0);

  const DAILY_XP_GOAL = 50;

  // ── Queries / mutations ──────────────────────────────────────────
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/words/categories", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/words/categories/${user!.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
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

  const startQuizMutation = useMutation({
    mutationFn: async (category: string) => {
      const res = await apiRequest("GET", `/api/quiz/${user!.id}?category=${encodeURIComponent(category)}`);
      return res.json() as Promise<QuizQuestion[]>;
    },
    onSuccess: (data) => {
      setQuestions(data);
      setCurrentQ(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setGameMode("quiz");
      setView("quiz");
    },
  });

  const startMatchMutation = useMutation({
    mutationFn: async (category: string) => {
      const res = await apiRequest("GET", `/api/words?category=${encodeURIComponent(category)}`);
      return res.json() as Promise<Word[]>;
    },
    onSuccess: (words) => {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      // Round count to nearest multiple of 4, max 12 (3 rounds)
      const count = Math.min(12, Math.floor(shuffled.length / 4) * 4);
      const gameWords = shuffled.slice(0, count);
      const round0 = gameWords.slice(0, 4);
      setMatchWords(gameWords);
      setRightOrder([...round0].sort(() => Math.random() - 0.5).map(w => w.id));
      setMatchRound(0);
      setMatchedIds(new Set());
      setMatchScore(0);
      setSelectedLeft(null);
      setSelectedRight(null);
      setWrongPairIds(new Set());
      setMatchLocked(false);
      setGameMode("match");
      setView("match");
    },
  });

  const completeGameMutation = useMutation({
    mutationFn: async ({ finalScore, total }: { finalScore: number; total: number }) => {
      const res = await apiRequest("POST", "/api/quiz/complete", {
        userId: user!.id,
        score: finalScore,
        totalQuestions: total,
        categoryId: selectedCategory,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      setView("results");
      if (data.user) setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/words/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/words/unlocked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
    onError: () => {
      // Unfreeze the match board if the request fails
      setMatchLocked(false);
    },
  });

  const flashcardMutation = useMutation({
    mutationFn: async ({ category, mode }: { category: string; mode: "quiz" | "match" }) => {
      const res = await apiRequest("GET", `/api/words?category=${encodeURIComponent(category)}`);
      const words = (await res.json()) as Word[];
      return { words, mode };
    },
    onSuccess: ({ words, mode }) => {
      const sample = [...words].sort(() => Math.random() - 0.5).slice(0, 6);
      setFlashcardWords(sample.length > 0 ? sample : words.slice(0, 6));
      setFlashcardIndex(0);
      setFlashcardRevealed(false);
      setPendingMode(mode);
      setView("flashcard");
    },
  });

  const recordAnswerMutation = useMutation({
    mutationFn: async ({ wordId, correct }: { wordId: number; correct: boolean }) => {
      const res = await apiRequest("POST", "/api/progress", { userId: user!.id, wordId, correct });
      return res.json();
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────
  const normalizeOption = (s: string) => (s || "").trim().normalize("NFC").toLowerCase();

  const getWordDisplay = (word: Word) =>
    user?.preferredScript === "cyrillic" && word.cyrillicPamiri
      ? word.cyrillicPamiri
      : word.latinPamiri;

  // ── Emoji helpers ────────────────────────────────────────────────
  const CATEGORY_EMOJI: Record<string, string> = {
    "Greetings and Basics": "👋",
    "Numbers and Quantities": "🔢",
    "Pronouns and Particles": "👤",
    "Family and Kinship": "👨‍👩‍👧",
    "The Human Body": "🫀",
    "Adjectives and Qualities": "✨",
    "Verbs and Actions": "🏃",
    "Food and Drink": "🍎",
    "Nature and Landscape": "🏔️",
    "House and Home": "🏠",
    "Time and Seasons": "🌙",
    "Agriculture and Livestock": "🌾",
    "Animals and Birds": "🦅",
    "Household Objects and Tools": "🔧",
    "Clothing and Appearance": "👕",
    "Social Life and Ceremonies": "🎉",
    "Trade and Money": "💰",
    "Emotions and Mental States": "❤️",
    "Health and Illness": "🏥",
    "Speech and Communication": "💬",
    "Movement and Travel": "🚶",
    "War and Conflict": "⚔️",
    "Descriptive and Abstract": "💭",
  };

  function getWordEmoji(english: string, category: string): string {
    const e = english.toLowerCase();
    if (e.includes("hello") || e.includes("hi") || e.includes("greet")) return "👋";
    if (e.includes("goodbye") || e.includes("bye")) return "🙋";
    if (e.includes("thank")) return "🙏";
    if (e.includes("yes")) return "✅";
    if (e.includes("no") && e.length < 5) return "❌";
    if (e.includes("okay") || e === "ok") return "👌";
    if (e.includes("water")) return "💧";
    if (e.includes("fire")) return "🔥";
    if (e.includes("bread")) return "🍞";
    if (e.includes("milk")) return "🥛";
    if (e.includes("meat")) return "🥩";
    if (e.includes("apple") || e.includes("fruit")) return "🍎";
    if (e.includes("mother") || e.includes("mom")) return "👩";
    if (e.includes("father") || e.includes("dad")) return "👨";
    if (e.includes("son") || e.includes("brother")) return "👦";
    if (e.includes("daughter") || e.includes("sister")) return "👧";
    if (e.includes("child") || e.includes("baby")) return "🧒";
    if (e.includes("sun")) return "☀️";
    if (e.includes("moon")) return "🌙";
    if (e.includes("star")) return "⭐";
    if (e.includes("mountain")) return "⛰️";
    if (e.includes("river") || e.includes("stream")) return "🌊";
    if (e.includes("house") || e.includes("home")) return "🏠";
    if (e.includes("dog")) return "🐕";
    if (e.includes("cat")) return "🐱";
    if (e.includes("horse")) return "🐴";
    if (e.includes("bird")) return "🐦";
    if (e.includes("sheep") || e.includes("goat")) return "🐑";
    if (e.includes("cow") || e.includes("bull")) return "🐄";
    if (e.includes("eye")) return "👁️";
    if (e.includes("hand")) return "✋";
    if (e.includes("heart")) return "❤️";
    if (e.includes("head")) return "🧠";
    if (e.includes("good") || e.includes("nice")) return "👍";
    if (e.includes("bad")) return "👎";
    if (e.includes("big") || e.includes("large")) return "🔼";
    if (e.includes("small") || e.includes("little")) return "🔽";
    if (e.includes("eat") || e.includes("food")) return "🍽️";
    if (e.includes("drink")) return "🥤";
    if (e.includes("sleep")) return "😴";
    if (e.includes("love")) return "❤️";
    if (e.includes("go") || e.includes("walk")) return "🚶";
    if (e.includes("come")) return "👉";
    if (e.includes("money") || e.includes("coin")) return "💰";
    if (e.includes("day")) return "🌅";
    if (e.includes("night")) return "🌃";
    if (e.includes("year")) return "📅";
    if (e.includes("winter")) return "❄️";
    if (e.includes("summer")) return "☀️";
    if (e.includes("spring")) return "🌸";
    if (e.includes("autumn") || e.includes("fall")) return "🍂";
    if (e === "i" || e === "me") return "🙋";
    if (e === "you") return "👉";
    if (e === "we" || e === "us") return "👥";
    if (e === "they" || e === "them") return "👥";
    if (e.includes("one") || e === "1") return "1️⃣";
    if (e.includes("two") || e === "2") return "2️⃣";
    if (e.includes("three") || e === "3") return "3️⃣";
    if (e.includes("four") || e === "4") return "4️⃣";
    if (e.includes("five") || e === "5") return "5️⃣";
    return CATEGORY_EMOJI[category] || "📖";
  }

  // ── Quiz handlers ────────────────────────────────────────────────
  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    const q = questions[currentQ];
    const isCorrect = normalizeOption(answer) === normalizeOption(q.correctAnswer);
    setSelectedAnswer(answer);
    setShowFeedback(true);
    if (isCorrect) setScore(s => s + 1);
    recordAnswerMutation.mutate({ wordId: q.wordId, correct: isCorrect });
  };

  const handleNext = () => {
    if (currentQ >= questions.length - 1) {
      // `score` already includes the current question (incremented in handleAnswer)
      setResultScore(score);
      setResultTotal(questions.length);
      completeGameMutation.mutate({ finalScore: score, total: questions.length });
    } else {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  // ── Match handlers ────────────────────────────────────────────────
  const totalMatchRounds = Math.ceil(matchWords.length / 4);

  const advanceMatchRound = (newMatchedIds: Set<number>, newScore: number) => {
    setMatchLocked(true);
    setTimeout(() => {
      const next = matchRound + 1;
      if (next < totalMatchRounds) {
        const nextWords = matchWords.slice(next * 4, (next + 1) * 4);
        setMatchRound(next);
        setRightOrder([...nextWords].sort(() => Math.random() - 0.5).map(w => w.id));
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatchLocked(false);
      } else {
        setResultScore(newScore);
        setResultTotal(matchWords.length);
        completeGameMutation.mutate({ finalScore: newScore, total: matchWords.length });
      }
    }, 500);
  };

  const checkMatch = (leftId: number, rightId: number, curMatched: Set<number>, curScore: number) => {
    if (leftId === rightId) {
      // ✓ Correct
      const newMatched = new Set(curMatched);
      newMatched.add(leftId);
      const newScore = curScore + 1;
      setMatchedIds(newMatched);
      setMatchScore(newScore);
      setSelectedLeft(null);
      setSelectedRight(null);
      recordAnswerMutation.mutate({ wordId: leftId, correct: true });
      const roundWords = matchWords.slice(matchRound * 4, (matchRound + 1) * 4);
      if (roundWords.every(w => newMatched.has(w.id))) {
        advanceMatchRound(newMatched, newScore);
      }
    } else {
      // ✗ Wrong — shake and clear
      setWrongPairIds(new Set([leftId, rightId]));
      setMatchLocked(true);
      recordAnswerMutation.mutate({ wordId: leftId, correct: false });
      setTimeout(() => {
        setWrongPairIds(new Set());
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatchLocked(false);
      }, 650);
    }
  };

  const handleLeftSelect = (wordId: number) => {
    if (matchLocked || matchedIds.has(wordId)) return;
    if (selectedLeft === wordId) { setSelectedLeft(null); return; }
    setSelectedLeft(wordId);
    if (selectedRight !== null) checkMatch(wordId, selectedRight, matchedIds, matchScore);
  };

  const handleRightSelect = (wordId: number) => {
    if (matchLocked || matchedIds.has(wordId)) return;
    if (selectedRight === wordId) { setSelectedRight(null); return; }
    setSelectedRight(wordId);
    if (selectedLeft !== null) checkMatch(selectedLeft, wordId, matchedIds, matchScore);
  };

  if (!user) return null;

  // ══════════════════════════════════════════════════════════════════
  // CATEGORIES VIEW  — Duolingo-style path
  // ══════════════════════════════════════════════════════════════════
  if (view === "categories") {
    // zigzag offsets: each category node is offset left/right/center
    const OFFSETS = ["justify-start pl-8", "justify-center", "justify-end pr-8", "justify-center"];

    const totalXp = stats?.totalXp || user.totalXp;
    const streak = stats?.currentStreak || user.currentStreak;
    const todayXp = Math.min(DAILY_XP_GOAL, totalXp % DAILY_XP_GOAL || (totalXp > 0 ? DAILY_XP_GOAL : 0));
    const dailyDone = todayXp >= DAILY_XP_GOAL;
    const wordOfTheDay = unlockedWords && unlockedWords.length > 0
      ? unlockedWords[Math.floor(new Date().getDate() * 7 + new Date().getMonth() * 31) % unlockedWords.length]
      : null;

    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
        {/* Greeting header */}
        <div className="pt-4 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" data-testid="text-welcome">
              {t("home.welcome")}, {user.displayName}!
            </h2>
            <p className="text-sm text-muted-foreground">{t("home.subtitle")}</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
              <Flame size={15} className="text-orange-500" />
              <span className="text-sm font-bold text-orange-500" data-testid="text-streak">{streak}</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{t("home.streak")}</span>
          </div>
        </div>

        {/* Daily goal bar */}
        <div className="mb-4">
          <Card className={dailyDone ? "border-primary/40" : ""}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-3">
                <Zap size={16} className={dailyDone ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium">{t("home.dailyGoal")}</span>
                    <span className="text-xs text-muted-foreground">{Math.min(todayXp, DAILY_XP_GOAL)}/{DAILY_XP_GOAL} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${Math.min(100, (todayXp / DAILY_XP_GOAL) * 100)}%` }}
                    />
                  </div>
                </div>
                {dailyDone && <span className="text-xs font-bold text-primary shrink-0">✓</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Word of the Day */}
        {wordOfTheDay && (
          <div className="mb-4">
            <Card
              className="cursor-pointer overflow-hidden border-l-4 border-l-primary"
              onClick={() => setWordFlipped(f => !f)}
              data-testid="word-of-day"
            >
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Star size={12} className="text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("home.wordOfDay")}
                  </span>
                </div>
                <div className="flex items-center justify-between min-h-[36px]">
                  {!wordFlipped ? (
                    <>
                      <p className="text-xl font-bold">
                        {cap(user.preferredScript === "cyrillic" && wordOfTheDay.cyrillicPamiri
                          ? wordOfTheDay.cyrillicPamiri
                          : wordOfTheDay.latinPamiri)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("home.tapToFlip")}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-primary">
                        {cap(wordOfTheDay.russian)} / {cap(wordOfTheDay.english)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cap(user.preferredScript === "cyrillic" && wordOfTheDay.cyrillicPamiri
                          ? wordOfTheDay.cyrillicPamiri
                          : wordOfTheDay.latinPamiri)}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section label */}
        <div className="pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider" data-testid="text-learn-title">{t("learn.title")}</h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-6 pt-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="w-20 h-20 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="relative pt-4 pb-4">
            {/* Vertical guide line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border/60 rounded-full" />

            <div className="relative flex flex-col gap-1">
              {categories?.map((cat: any, idx: number) => {
                const isPlayable = cat.unlocked && cat.wordCount >= 4;
                const isLocked = !cat.unlocked;
                const isFewWords = cat.unlocked && cat.wordCount < 4;
                const emoji = CATEGORY_EMOJI[cat.category] || "📖";
                const offsetClass = OFFSETS[idx % OFFSETS.length];

                return (
                  <div
                    key={cat.category}
                    className="flex flex-col"
                    data-testid={`category-${cat.category.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {/* Node row */}
                    <div className={`flex ${offsetClass}`}>
                      <div className="flex flex-col items-center gap-2 py-3 w-36">
                        {/* Circle node */}
                        <motion.button
                          whileTap={isPlayable ? { scale: 0.92 } : undefined}
                          onClick={() => {
                            if (!isPlayable) return;
                            const mode: "quiz" | "match" = Math.random() > 0.5 ? "quiz" : "match";
                            setSelectedCategory(cat.category);
                            flashcardMutation.mutate({ category: cat.category, mode });
                          }}
                          disabled={flashcardMutation.isPending && selectedCategory === cat.category}
                          className={`relative w-20 h-20 rounded-full border-[3px] flex flex-col items-center justify-center transition-all duration-200 select-none
                            ${isLocked
                              ? "border-muted-foreground/20 bg-muted/30 cursor-default"
                              : isFewWords
                              ? "border-muted-foreground/30 bg-muted/20 cursor-default"
                              : "border-primary bg-primary/10 hover:bg-primary/20 cursor-pointer shadow-md shadow-primary/10"
                            }
                          `}
                        >
                          {/* Pulse ring for first playable category */}
                          {isPlayable && idx === categories.findIndex((c: any) => c.unlocked && c.wordCount >= 4) && (
                            <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
                          )}

                          <span className={`text-2xl ${isLocked ? "grayscale opacity-40" : ""}`}>{emoji}</span>

                          {isLocked && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-muted-foreground/40 rounded-full flex items-center justify-center">
                              <Lock size={10} className="text-background" />
                            </div>
                          )}

                          {isPlayable && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow">
                              <Play size={10} fill="white" className="text-white ml-0.5" />
                            </div>
                          )}
                        </motion.button>

                        {/* Label */}
                        <div className="text-center">
                          <p className={`text-xs font-semibold leading-tight ${isLocked ? "text-muted-foreground/40" : "text-foreground"}`}>
                            {getCategoryName(cat.category, lang)}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {isLocked
                              ? `${t("learn.lvl")} ${cat.level}`
                              : `${cat.wordCount} ${t("learn.words")}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FLASHCARD INTRO VIEW
  // ══════════════════════════════════════════════════════════════════
  if (view === "flashcard" && flashcardWords.length > 0) {
    const word = flashcardWords[flashcardIndex];
    const isLast = flashcardIndex === flashcardWords.length - 1;
    const emoji = getWordEmoji(word.english, selectedCategory || "");
    const pamiri = cap(
      user?.preferredScript === "cyrillic" && word.cyrillicPamiri
        ? word.cyrillicPamiri
        : word.latinPamiri
    );

    const handleNext = () => {
      if (!flashcardRevealed) {
        setFlashcardRevealed(true);
      } else if (isLast) {
        if (pendingMode === "quiz") {
          startQuizMutation.mutate(selectedCategory!);
        } else {
          startMatchMutation.mutate(selectedCategory!);
        }
      } else {
        setFlashcardIndex(i => i + 1);
        setFlashcardRevealed(false);
      }
    };

    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="pt-4 pb-4 space-y-3">
          <button
            onClick={() => setView("categories")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} /> {t("learn.back")}
          </button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{selectedCategory ? (getCategoryName(selectedCategory, lang)) : ""}</span>
            <span>{flashcardIndex + 1} / {flashcardWords.length}</span>
          </div>
          {/* Dot progress */}
          <div className="flex gap-1.5 justify-center pt-1">
            {flashcardWords.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < flashcardIndex
                    ? "bg-primary w-5"
                    : i === flashcardIndex
                    ? "bg-primary w-8"
                    : "bg-muted w-5"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${flashcardIndex}-${flashcardRevealed}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.22 }}
            onClick={() => !flashcardRevealed && setFlashcardRevealed(true)}
            className="cursor-pointer select-none"
          >
            <Card className="min-h-[300px] flex items-center justify-center border-primary/30 overflow-hidden relative">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-500/8 pointer-events-none" />
              <CardContent className="pt-8 pb-8 text-center w-full space-y-5">
                <div className="text-7xl leading-none">{emoji}</div>
                <div className="space-y-2">
                  <p className="text-3xl font-black tracking-tight">{pamiri}</p>
                  {flashcardRevealed ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-1 pt-1"
                    >
                      <p className="text-xl font-bold text-primary">{cap(word.russian)}</p>
                      <p className="text-base text-muted-foreground">{cap(word.english)}</p>
                      {word.tajik && (
                        <p className="text-sm text-muted-foreground/70">{cap(word.tajik)}</p>
                      )}
                    </motion.div>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 pt-1">
                      Нажмите, чтобы увидеть перевод
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Action button */}
        <div className="mt-5">
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleNext}
            disabled={startQuizMutation.isPending || startMatchMutation.isPending}
          >
            {!flashcardRevealed
              ? "Показать перевод"
              : isLast
              ? pendingMode === "quiz"
                ? "Начать тест →"
                : "Начать игру →"
              : "Следующее слово →"}
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // QUIZ VIEW
  // ══════════════════════════════════════════════════════════════════
  if (view === "quiz" && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-5">
        <div className="pt-4 space-y-3">
          <button
            onClick={() => setView("categories")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            data-testid="button-back-categories"
          >
            <ChevronLeft size={16} /> {t("learn.back")}
          </button>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{selectedCategory ? (getCategoryName(selectedCategory, lang)) : ""}</span>
              <span>{currentQ + 1}/{questions.length}</span>
            </div>
            <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" data-testid="quiz-progress" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mb-4">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">{t("learn.whatMeans")}</p>
                <p className="text-xl font-bold" data-testid="text-quiz-prompt">{cap(q.prompt)}</p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {q.options.map((option, i) => {
                let extra = "";
                if (showFeedback) {
                  if (normalizeOption(option) === normalizeOption(q.correctAnswer))
                    extra = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                  else if (option === selectedAnswer)
                    extra = "border-destructive bg-destructive/10 text-destructive";
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(option)}
                    disabled={showFeedback}
                    data-testid={`option-${i}`}
                    className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-all ${
                      extra || "border-border hover:border-primary/40 bg-card"
                    } ${showFeedback ? "pointer-events-none" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-2">
                      {showFeedback && normalizeOption(option) === normalizeOption(q.correctAnswer) && (
                        <CheckCircle size={16} className="text-green-500 shrink-0" />
                      )}
                      {showFeedback && option === selectedAnswer && normalizeOption(option) !== normalizeOption(q.correctAnswer) && (
                        <XCircle size={16} className="text-destructive shrink-0" />
                      )}
                      <span>{cap(option)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {showFeedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleNext}
              data-testid="button-next"
              disabled={completeGameMutation.isPending}
            >
              {currentQ >= questions.length - 1 ? t("learn.finish") : t("learn.next")}
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // MATCH GAME VIEW
  // ══════════════════════════════════════════════════════════════════
  if (view === "match") {
    const roundWords  = matchWords.slice(matchRound * 4, (matchRound + 1) * 4);
    const rightWords  = rightOrder
      .map(id => matchWords.find(w => w.id === id))
      .filter((w): w is Word => !!w);

    const cellClass = (wordId: number, side: "left" | "right") => {
      if (matchedIds.has(wordId))
        return "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 cursor-default";
      if (wrongPairIds.has(wordId))
        return "border-destructive bg-destructive/10 text-destructive";
      if (side === "left" && selectedLeft === wordId)
        return "border-primary bg-primary/10 text-primary";
      if (side === "right" && selectedRight === wordId)
        return "border-primary bg-primary/10 text-primary";
      return "border-border bg-card hover:border-primary/40 cursor-pointer";
    };

    const shakeAnim = (wordId: number) =>
      wrongPairIds.has(wordId)
        ? { x: [0, -7, 7, -5, 5, -3, 3, 0] }
        : {};

    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="pt-4 space-y-3">
          <button
            onClick={() => setView("categories")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} /> {t("learn.back")}
          </button>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shuffle size={12} />
                {selectedCategory ? (getCategoryName(selectedCategory, lang)) : ""}
              </span>
              <span>{t("learn.round")} {matchRound + 1}/{totalMatchRounds}</span>
            </div>
            <Progress
              value={(matchedIds.size / matchWords.length) * 100}
              className="h-2"
            />
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {t("learn.matchInstruction")}
        </p>

        {/* Match grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={matchRound}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-2 gap-2"
          >
            {/* Left: Pamiri words */}
            <div className="space-y-2">
              {roundWords.map(word => (
                <motion.button
                  key={`L${word.id}`}
                  onClick={() => handleLeftSelect(word.id)}
                  animate={shakeAnim(word.id)}
                  transition={{ duration: 0.45 }}
                  className={`w-full min-h-[52px] p-2.5 rounded-xl border-2 text-sm font-bold text-left transition-colors ${cellClass(word.id, "left")}`}
                >
                  {matchedIds.has(word.id) && (
                    <CheckCircle size={12} className="inline mr-1 text-green-500" />
                  )}
                  {cap(getWordDisplay(word))}
                </motion.button>
              ))}
            </div>

            {/* Right: translations (shuffled) */}
            <div className="space-y-2">
              {rightWords.map(word => (
                <motion.button
                  key={`R${word.id}`}
                  onClick={() => handleRightSelect(word.id)}
                  animate={shakeAnim(word.id)}
                  transition={{ duration: 0.45 }}
                  className={`w-full min-h-[52px] p-2.5 rounded-xl border-2 text-sm text-left transition-colors ${cellClass(word.id, "right")}`}
                >
                  {matchedIds.has(word.id) && (
                    <CheckCircle size={12} className="inline mr-1 text-green-500" />
                  )}
                  {cap(word.russian)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pair counter */}
        {matchedIds.size > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {matchedIds.size} / {matchWords.length} {t("learn.pairs")}
          </p>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RESULTS VIEW
  // ══════════════════════════════════════════════════════════════════
  if (view === "results" && quizResult) {
    const emoji = resultScore === resultTotal ? "🎉" : resultScore >= resultTotal / 2 ? "👍" : "💪";
    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pt-8 text-center space-y-4"
        >
          <div className="text-5xl mb-2">{emoji}</div>
          <h2 className="text-xl font-bold" data-testid="text-quiz-score">
            {resultScore}/{resultTotal} {t("learn.correct")}
          </h2>

          <Card>
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("learn.xpEarned")}</span>
                <span className="font-bold text-primary" data-testid="text-xp-earned">+{quizResult.xpEarned} XP</span>
              </div>
              {quizResult.newLevel > (user?.level || 1) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("learn.newLevel")}</span>
                  <span className="font-bold">{t("home.level")} {quizResult.newLevel}</span>
                </div>
              )}
              {quizResult.newUnlocks?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">{t("learn.newCategories")}</p>
                  {quizResult.newUnlocks.map((cat: string) => (
                    <p key={cat} className="text-sm font-medium text-primary">{getCategoryName(cat, lang)}</p>
                  ))}
                </div>
              )}
              {quizResult.newBadges?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">{t("learn.newBadges")}</p>
                  {quizResult.newBadges.map((b: string) => (
                    <p key={b} className="text-sm font-medium">{b.replace(/_/g, " ")}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 h-11"
              onClick={() => { setView("categories"); setQuizResult(null); }}
              data-testid="button-back-to-categories"
            >
              {t("learn.categories")}
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={() => {
                if (!selectedCategory) return;
                setQuizResult(null);
                if (gameMode === "match") startMatchMutation.mutate(selectedCategory);
                else startQuizMutation.mutate(selectedCategory);
              }}
              data-testid="button-retry"
            >
              {t("learn.retry")}
            </Button>
          </div>
        </motion.div>

      </div>
    );
  }

  return null;
}
