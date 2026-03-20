import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lock, CheckCircle, XCircle, ArrowRight, ChevronLeft, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CATEGORY_RU, CATEGORY_TJ, type QuizQuestion, type Word } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

type View = "categories" | "quiz" | "match" | "results";

export default function LearnPage() {
  const { user, setUser } = useUser();
  const { t } = useLanguage();
  const [view, setView]   = useState<View>("categories");
  const [gameMode, setGameMode] = useState<"quiz" | "match">("quiz");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // ── Shared results state ─────────────────────────────────────────
  const [resultScore, setResultScore] = useState(0);
  const [resultTotal, setResultTotal] = useState(0);

  // ── Queries / mutations ──────────────────────────────────────────
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/words/categories", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/words/categories/${user!.id}`);
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
  // CATEGORIES VIEW
  // ══════════════════════════════════════════════════════════════════
  if (view === "categories") {
    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-4">
        <div className="pt-4">
          <h2 className="text-lg font-bold" data-testid="text-learn-title">{t("learn.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("learn.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {categories?.map((cat: any) => (
              <Card
                key={cat.category}
                className={`transition-all ${cat.unlocked ? "" : "opacity-50"}`}
                data-testid={`category-${cat.category.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{CATEGORY_RU[cat.category] || cat.category}</p>
                      {CATEGORY_TJ[cat.category] && (
                        <p className="text-xs text-muted-foreground/70">{CATEGORY_TJ[cat.category]}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{cat.wordCount} {t("learn.words")}</p>
                    </div>

                    {cat.unlocked && cat.wordCount >= 4 ? (
                      <div className="flex gap-1.5 shrink-0">
                        {/* Match mode button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-xs gap-1"
                          onClick={() => {
                            setSelectedCategory(cat.category);
                            startMatchMutation.mutate(cat.category);
                          }}
                          disabled={startMatchMutation.isPending}
                          title={t("learn.match")}
                        >
                          <Shuffle size={12} />
                          {t("learn.match")}
                        </Button>
                        {/* Quiz mode button */}
                        <Button
                          size="sm"
                          className="h-8 px-2.5 text-xs gap-1"
                          onClick={() => {
                            setSelectedCategory(cat.category);
                            startQuizMutation.mutate(cat.category);
                          }}
                          disabled={startQuizMutation.isPending}
                        >
                          {t("learn.test")}
                          <ArrowRight size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                        {cat.unlocked
                          ? <span className="text-xs">{t("learn.fewWords")}</span>
                          : <><Lock size={14} /><span className="text-xs">{t("learn.lvl")} {cat.level}</span></>
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
              <span>{selectedCategory ? (CATEGORY_RU[selectedCategory] || selectedCategory) : ""}</span>
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
                <p className="text-xl font-bold" data-testid="text-quiz-prompt">{q.prompt}</p>
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
                      <span>{option}</span>
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
                {selectedCategory ? (CATEGORY_RU[selectedCategory] || selectedCategory) : ""}
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
                  {getWordDisplay(word)}
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
                  {word.russian}
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
                    <p key={cat} className="text-sm font-medium text-primary">{CATEGORY_RU[cat] || cat}</p>
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
