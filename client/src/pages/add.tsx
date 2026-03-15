import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PamiriKeyboard } from "@/components/PamiriKeyboard";
import { useUser } from "@/contexts/UserContext";
import { CreatedByAttribution } from "@/components/CreatedByAttribution";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CATEGORY_UNLOCKS, CATEGORY_RU } from "@shared/schema";
import { Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddPage() {
  const { user, setUser } = useUser();
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
        addedByUserId: user!.id,
      });
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Refetch user to get updated XP
      apiRequest("GET", `/api/users/${user!.id}`).then(r => r.json()).then(u => setUser(u));
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

  if (!user) return null;

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto space-y-5">
      <div className="pt-4">
        <h2 className="text-lg font-bold" data-testid="text-add-title">
          Добавить слово
        </h2>
        <p className="text-sm text-muted-foreground">
          Поделитесь словом, которое вы знаете
        </p>
      </div>

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
            <p className="text-base font-semibold">
              Спасибо!
            </p>
            <div className="flex items-center justify-center gap-1 text-primary font-bold">
              <Sparkles size={16} />
              <span>+50 XP</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ваше слово будет проверено модератором
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card>
              <CardContent className="pt-4 pb-4 space-y-3">
                {/* Latin Pamiri */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Памирский (латиница)
                  </label>
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

                {/* Cyrillic Pamiri */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Памирский (кириллица)
                  </label>
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

                {/* English */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Английский</label>
                  <Input
                    data-testid="input-english"
                    placeholder="Перевод на английский"
                    value={english}
                    onChange={e => setEnglish(e.target.value)}
                    onFocus={() => setFocusedField(null)}
                    className="h-10"
                  />
                </div>

                {/* Russian */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Русский</label>
                  <Input
                    data-testid="input-russian"
                    placeholder="Перевод на русский"
                    value={russian}
                    onChange={e => setRussian(e.target.value)}
                    onFocus={() => setFocusedField(null)}
                    className="h-10"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Категория
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-category" className="h-10">
                      <SelectValue placeholder="Выберите категорию" />
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

            {/* Preview */}
            {latinPamiri && (
              <Card className="border-primary/20">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-muted-foreground mb-1">Предпросмотр</p>
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
              {submitMutation.isPending
                ? "..."
                : "Отправить (+50 XP)"}
            </Button>

            {submitMutation.isError && (
              <p className="text-destructive text-xs text-center">
                {submitMutation.error?.message || "Что-то пошло не так"}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom keyboard */}
      {focusedField && !submitted && (
        <div className="fixed bottom-16 left-0 right-0">
          <PamiriKeyboard
            script={focusedField === "latin" ? "latin" : "cyrillic"}
            onKeyPress={handleKeyPress}
          />
        </div>
      )}

      <CreatedByAttribution />
    </div>
  );
}
