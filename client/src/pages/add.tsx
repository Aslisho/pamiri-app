import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PamiriKeyboard } from "@/components/PamiriKeyboard";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CATEGORY_UNLOCKS, CATEGORY_RU, APPROVAL_THRESHOLD, type PendingWordReview } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, CheckCircle, ThumbsUp, ThumbsDown, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [tab, setTab] = useState<"add" | "review">("add");

  if (!user) return null;

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-5">
      <div className="pt-4">
        <h2 className="text-lg font-bold">
          {tab === "add" ? t("add.addWord") : t("add.reviewWords")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tab === "add"
            ? t("add.addSubtitle")
            : t("add.reviewSubtitle")}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-border">
        <button
          onClick={() => setTab("add")}
          className={`py-2.5 text-sm font-medium transition-colors ${
            tab === "add"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("add.tabAdd")}
        </button>
        <button
          onClick={() => setTab("review")}
          className={`py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            tab === "review"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList size={14} />
          {t("add.tabReview")}
        </button>
      </div>

      {tab === "add" ? <AddForm user={user} /> : <ReviewQueue user={user} />}
    </div>
  );
}

// ─── Add Form ───────────────────────────────────────────────────────────────

function AddForm({ user }: { user: NonNullable<ReturnType<typeof useUser>["user"]> }) {
  const { setUser } = useUser();
  const { t } = useLanguage();
  const [latinPamiri, setLatinPamiri] = useState("");
  const [cyrillicPamiri, setCyrillicPamiri] = useState("");
  const [english, setEnglish] = useState("");
  const [russian, setRussian] = useState("");
  const [category, setCategory] = useState("");
  const [focusedField, setFocusedField] = useState<"latin" | "cyrillic" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const latinRef = useRef<HTMLInputElement>(null);
  const cyrillicRef = useRef<HTMLInputElement>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/words", {
        latinPamiri,
        cyrillicPamiri,
        english,
        russian,
        category,
        source: "community",
        addedByUserId: user.id,
      });
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      apiRequest("GET", `/api/users/${user.id}`).then(r => r.json()).then(u => setUser(u));
      setTimeout(() => {
        setSubmitted(false);
        setLatinPamiri("");
        setCyrillicPamiri("");
        setEnglish("");
        setRussian("");
        setCategory("");
      }, 2500);
    },
  });

  const handleKeyPress = (char: string) => {
    if (focusedField === "latin") {
      setLatinPamiri(prev => prev + char);
      latinRef.current?.focus();
    } else if (focusedField === "cyrillic") {
      setCyrillicPamiri(prev => prev + char);
      cyrillicRef.current?.focus();
    }
  };

  const allCategories = Object.keys(CATEGORY_UNLOCKS);
  const canSubmit = latinPamiri.trim() && english.trim() && russian.trim() && category;

  return (
    <>
      <AnimatePresence>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 space-y-3"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check size={32} className="text-primary" />
              </div>
            </div>
            <p className="text-base font-semibold">{t("add.thanks")}</p>
            <div className="flex items-center justify-center gap-1 text-primary font-bold">
              <Sparkles size={16} />
              <span>+50 XP</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("add.sentForReview")}
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card>
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t("add.pamiriLatin")}</label>
                  <Input
                    ref={latinRef}
                    data-testid="input-latin"
                    placeholder="напр. salomolek"
                    value={latinPamiri}
                    onChange={e => setLatinPamiri(e.target.value)}
                    onFocus={() => setFocusedField("latin")}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t("add.pamiriCyrillic")}</label>
                  <Input
                    ref={cyrillicRef}
                    data-testid="input-cyrillic"
                    placeholder="напр. саломолек"
                    value={cyrillicPamiri}
                    onChange={e => setCyrillicPamiri(e.target.value)}
                    onFocus={() => setFocusedField("cyrillic")}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t("add.english")}</label>
                  <Input
                    data-testid="input-english"
                    placeholder="Перевод на английский"
                    value={english}
                    onChange={e => setEnglish(e.target.value)}
                    onFocus={() => setFocusedField(null)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t("add.russian")}</label>
                  <Input
                    data-testid="input-russian"
                    placeholder="Перевод на русский"
                    value={russian}
                    onChange={e => setRussian(e.target.value)}
                    onFocus={() => setFocusedField(null)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t("add.category")}</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-category" className="h-10">
                      <SelectValue placeholder={t("add.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map(c => (
                        <SelectItem key={c} value={c}>{CATEGORY_RU[c] || c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {latinPamiri && (
              <Card className="border-primary/20">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-muted-foreground mb-1">{t("add.preview")}</p>
                  <p className="text-base font-bold">{latinPamiri}</p>
                  {cyrillicPamiri && <p className="text-sm text-muted-foreground">{cyrillicPamiri}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {english && <span>EN: {english}</span>}
                    {russian && <span>RU: {russian}</span>}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full h-12 text-base font-semibold"
              disabled={!canSubmit || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              data-testid="button-submit-word"
            >
              {submitMutation.isPending ? "..." : t("add.submit")}
            </Button>

            {submitMutation.isError && (
              <p className="text-destructive text-xs text-center">
                {submitMutation.error?.message || t("add.error")}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {focusedField && !submitted && (
        <div className="fixed bottom-16 left-0 right-0">
          <PamiriKeyboard
            script={focusedField === "latin" ? "latin" : "cyrillic"}
            onKeyPress={handleKeyPress}
          />
        </div>
      )}
    </>
  );
}

// ─── Review Queue ────────────────────────────────────────────────────────────

export function ReviewQueue({ user, isModerator = false }: {
  user: NonNullable<ReturnType<typeof useUser>["user"]>;
  isModerator?: boolean;
}) {
  const { setUser } = useUser();
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [xpFlash, setXpFlash] = useState(false);
  const [voteFeedback, setVoteFeedback] = useState<{ netVotes: number; autoApproved?: boolean; xpEarned?: number } | null>(null);
  const [sessionVotedWords, setSessionVotedWords] = useState<Array<{ id: number; netVotes: number }>>([]);

  const queryKeyTag = isModerator ? "mod" : "user";
  const { data: words, isLoading } = useQuery<PendingWordReview[]>({
    queryKey: ["/api/words/pending-review", user.id, queryKeyTag],
    queryFn: async () => {
      const params = new URLSearchParams({ userId: user.id });
      if (isModerator) params.set("includeVoted", "true");
      const res = await apiRequest("GET", `/api/words/pending-review?${params}`);
      return res.json();
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ wordId, voteType }: { wordId: number; voteType: "up" | "down" }) => {
      const res = await apiRequest("POST", `/api/words/${wordId}/vote`, {
        userId: user.id,
        voteType,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Vote failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Show vote feedback with net votes
      const netVotes = data.word?.upvotesCount ?? 0;
      setVoteFeedback({ netVotes, autoApproved: data.autoApproved, xpEarned: data.xpEarned });
      setSessionVotedWords(prev => [...prev, { id: data.word.id, netVotes }]);

      if (data.xpEarned > 0) {
        setSessionXp(prev => prev + data.xpEarned);
        apiRequest("GET", `/api/users/${user.id}`).then(r => r.json()).then(u => setUser(u));
      }

      // Invalidate cache so voted words don't reappear on next visit
      queryClient.invalidateQueries({ queryKey: ["/api/words/pending-review"] });

      // Delay card advance so feedback is visible
      setTimeout(() => {
        setVoteFeedback(null);
        setIndex(prev => prev + 1);
      }, 1200);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (wordId: number) => {
      const res = await apiRequest("POST", `/api/words/${wordId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/words/pending-review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/words/pending"] });
      setIndex(prev => prev + 1);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalWords = words?.length ?? 0;
  const done = !words || totalWords === 0 || index >= totalWords;

  if (done) {
    const closeToApproval = sessionVotedWords.filter(
      w => w.netVotes >= APPROVAL_THRESHOLD - 1 && w.netVotes > 0
    ).length;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 space-y-4"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle size={32} className="text-primary" />
          </div>
        </div>
        {totalWords === 0 ? (
          <>
            <p className="text-base font-semibold">{t("add.noWordsToReview")}</p>
            <p className="text-sm text-muted-foreground">
              {t("add.comeBackLater")}
            </p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold">{t("add.allReviewed")}</p>
            <p className="text-sm text-muted-foreground">
              {t("add.sessionSummary")
                .replace("{x}", String(index))
                .replace("{y}", String(closeToApproval))}
            </p>
            {closeToApproval > 0 && (
              <p className="text-sm text-green-600 font-medium">
                {closeToApproval} слов близки к одобрению
              </p>
            )}
            {sessionXp > 0 && (
              <div className="flex items-center justify-center gap-1 text-primary font-bold text-lg">
                <Sparkles size={18} />
                <span>+{sessionXp} {t("add.xpEarned")}</span>
              </div>
            )}
          </>
        )}
      </motion.div>
    );
  }

  const word = words[index];
  const isVoting = voteMutation.isPending || voteFeedback !== null;
  const alreadyVoted = isModerator && word.userVote;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalWords - index} {t("add.wordsWaiting")}</span>
        <span className="font-medium">{index + 1} / {totalWords}</span>
      </div>

      {/* Vote feedback flash */}
      <AnimatePresence>
        {voteFeedback && (
          <motion.div
            key="vote-feedback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center space-y-1"
          >
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {t("add.voteRecorded").replace("{n}", voteFeedback.netVotes > 0 ? `+${voteFeedback.netVotes}` : String(voteFeedback.netVotes))}
            </p>
            {voteFeedback.autoApproved && (
              <p className="text-xs font-medium text-green-600">Слово одобрено автоматически!</p>
            )}
            {(voteFeedback.xpEarned ?? 0) > 0 && (
              <div className="flex items-center justify-center gap-1 text-primary font-bold text-sm">
                <Sparkles size={14} />
                +{voteFeedback.xpEarned} XP
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={word.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardContent className="pt-5 pb-5 space-y-4">
              {/* Pamiri word */}
              <div>
                <p className="text-2xl font-bold tracking-wide">{word.latinPamiri}</p>
                {word.cyrillicPamiri && (
                  <p className="text-base text-muted-foreground mt-0.5">{word.cyrillicPamiri}</p>
                )}
              </div>

              {/* Translations */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("add.english")}</p>
                  <p className="font-medium">{word.english}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("add.russian")}</p>
                  <p className="font-medium">{word.russian}</p>
                </div>
              </div>

              {/* Category + current vote tally + mod prior vote */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    {CATEGORY_RU[word.category] || word.category}
                  </span>
                  {alreadyVoted && (
                    <Badge variant="secondary" className="text-[10px]">
                      {word.userVote === "up" ? "Вы: +" : "Вы: -"}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-500 font-medium">
                    <ThumbsUp size={12} /> {word.upVotes}
                  </span>
                  <span className="flex items-center gap-1 text-red-500 font-medium">
                    <ThumbsDown size={12} /> {word.downVotes}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Explanation */}
      <p className="text-xs text-center text-muted-foreground">
        {t("add.isCorrect")}
      </p>

      {/* Vote buttons */}
      {!alreadyVoted && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 text-sm font-semibold border-red-500/40 text-red-500 hover:bg-red-500/10"
            disabled={isVoting}
            onClick={() => voteMutation.mutate({ wordId: word.id, voteType: "down" })}
          >
            <ThumbsDown size={16} className="mr-2" />
            {t("add.incorrect")}
          </Button>
          <Button
            className="h-12 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white"
            disabled={isVoting}
            onClick={() => voteMutation.mutate({ wordId: word.id, voteType: "up" })}
          >
            <ThumbsUp size={16} className="mr-2" />
            {t("add.correct")}
          </Button>
        </div>
      )}

      {/* Mod: approve button */}
      {isModerator && (
        <Button
          className="w-full h-10 text-sm font-semibold"
          disabled={approveMutation.isPending}
          onClick={() => approveMutation.mutate(word.id)}
        >
          <Check size={16} className="mr-2" />
          {t("add.markReady")}
        </Button>
      )}

      {/* Mod: skip button for already-voted words */}
      {alreadyVoted && !isModerator && null}
      {alreadyVoted && (
        <Button
          variant="ghost"
          className="w-full h-8 text-xs text-muted-foreground"
          onClick={() => setIndex(prev => prev + 1)}
        >
          Пропустить
        </Button>
      )}

      {/* Error / rate limit */}
      {voteMutation.isError && (
        <p className="text-destructive text-xs text-center">
          {voteMutation.error?.message?.includes("Too many")
            ? "Слишком много голосов. Подождите немного."
            : voteMutation.error?.message || t("add.error")}
        </p>
      )}

      {/* XP info */}
      {!alreadyVoted && (
        <p className="text-[11px] text-center text-muted-foreground">
          {t("add.xpPerReview")}
        </p>
      )}
    </div>
  );
}
