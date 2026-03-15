import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lock, CheckCircle, XCircle, ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { CreatedByAttribution } from "@/components/CreatedByAttribution";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CATEGORY_RU, type QuizQuestion } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

type View = "categories" | "quiz" | "results";

export default function LearnPage() {
  const { user, setUser } = useUser();
  const [view, setView] = useState<View>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

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
      setView("quiz");
    },
  });

  const completeQuizMutation = useMutation({
    mutationFn: async (finalScore: number) => {
      const res = await apiRequest("POST", "/api/quiz/complete", {
        userId: user!.id,
        score: finalScore,
        totalQuestions: questions.length,
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
  });

  const recordAnswerMutation = useMutation({
    mutationFn: async ({ wordId, correct }: { wordId: number; correct: boolean }) => {
      const res = await apiRequest("POST", "/api/progress", {
        userId: user!.id,
        wordId,
        correct,
      });
      return res.json();
    },
  });

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    const q = questions[currentQ];
    const isCorrect = answer === q.correctAnswer;
    setSelectedAnswer(answer);
    setShowFeedback(true);
    if (isCorrect) setScore(s => s + 1);
    recordAnswerMutation.mutate({ wordId: q.wordId, correct: isCorrect });
  };

  const handleNext = () => {
    if (currentQ >= questions.length - 1) {
      completeQuizMutation.mutate(score);
    } else {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  if (!user) return null;

  // Category picker
  if (view === "categories") {
    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-4">
        <div className="pt-4">
          <h2 className="text-lg font-bold" data-testid="text-learn-title">
            Выберите категорию
          </h2>
          <p className="text-sm text-muted-foreground">
            Проверьте свои знания
          </p>
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
                className={`transition-all ${
                  cat.unlocked
                    ? "cursor-pointer hover:border-primary/40"
                    : "opacity-50"
                }`}
                onClick={() => {
                  if (cat.unlocked && cat.wordCount >= 4) {
                    setSelectedCategory(cat.category);
                    startQuizMutation.mutate(cat.category);
                  }
                }}
                data-testid={`category-${cat.category.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{CATEGORY_RU[cat.category] || cat.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.wordCount} слов
                    </p>
                  </div>
                  {cat.unlocked ? (
                    <div className="text-primary">
                      <ArrowRight size={18} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Lock size={14} />
                      <span className="text-xs">Ур. {cat.level}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreatedByAttribution />
      </div>
    );
  }

  // Quiz view
  if (view === "quiz" && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-5">
        <div className="pt-4 space-y-3">
          {/* Back */}
          <button
            onClick={() => setView("categories")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            data-testid="button-back-categories"
          >
            <ChevronLeft size={16} /> Назад
          </button>

          {/* Progress bar */}
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
            {/* Question */}
            <Card className="mb-4">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Что означает?
                </p>
                <p className="text-xl font-bold" data-testid="text-quiz-prompt">
                  {q.prompt}
                </p>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((option, i) => {
                let extraClass = "";
                if (showFeedback) {
                  if (option === q.correctAnswer) {
                    extraClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                  } else if (option === selectedAnswer && option !== q.correctAnswer) {
                    extraClass = "border-destructive bg-destructive/10 text-destructive";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(option)}
                    disabled={showFeedback}
                    data-testid={`option-${i}`}
                    className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-all ${
                      extraClass || "border-border hover:border-primary/40 bg-card"
                    } ${showFeedback ? "pointer-events-none" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-2">
                      {showFeedback && option === q.correctAnswer && (
                        <CheckCircle size={16} className="text-green-500 shrink-0" />
                      )}
                      {showFeedback && option === selectedAnswer && option !== q.correctAnswer && (
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

        {/* Next button */}
        {showFeedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleNext}
              data-testid="button-next"
              disabled={completeQuizMutation.isPending}
            >
              {currentQ >= questions.length - 1 ? "Завершить" : "Далее"}
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // Results
  if (view === "results" && quizResult) {
    return (
      <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pt-8 text-center space-y-4"
        >
          <div className="text-5xl mb-2">
            {score === questions.length ? "🎉" : score >= questions.length / 2 ? "👍" : "💪"}
          </div>
          <h2 className="text-xl font-bold" data-testid="text-quiz-score">
            {score}/{questions.length} правильно
          </h2>
          <Card>
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Получено XP</span>
                <span className="font-bold text-primary" data-testid="text-xp-earned">+{quizResult.xpEarned} XP</span>
              </div>
              {quizResult.newLevel > (user?.level || 1) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Новый уровень!</span>
                  <span className="font-bold">Уровень {quizResult.newLevel}</span>
                </div>
              )}
              {quizResult.newUnlocks?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Открыты новые категории:</p>
                  {quizResult.newUnlocks.map((cat: string) => (
                    <p key={cat} className="text-sm font-medium text-primary">{CATEGORY_RU[cat] || cat}</p>
                  ))}
                </div>
              )}
              {quizResult.newBadges?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Новые значки:</p>
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
              onClick={() => {
                setView("categories");
                setQuizResult(null);
              }}
              data-testid="button-back-to-categories"
            >
              Категории
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={() => {
                if (selectedCategory) startQuizMutation.mutate(selectedCategory);
              }}
              data-testid="button-retry"
            >
              Ещё раз
            </Button>
          </div>
        </motion.div>

        <CreatedByAttribution />
      </div>
    );
  }

  return null;
}
