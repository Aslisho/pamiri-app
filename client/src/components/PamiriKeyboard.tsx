import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, X } from "lucide-react";

const LATIN_SPECIAL = [
  ["ā", "č", "ê", "š", "ž", "ů", "ẋ"],
  ["ɣ", "ɣ̌", "δ", "ϑ", "ʓ"],
];

const CYRILLIC_SPECIAL = [
  ["ғ", "гь", "дъ", "ӣ", "қ"],
  ["тъ", "ҳ", "хь", "ч̣"],
];

const CHAR_GUIDE = [
  { chars: "Žž", sound: "zh · ж", example: "žow", meaning: "cow · корова" },
  { chars: "Šš", sound: "sh · ш", example: "šamol", meaning: "wind · ветер" },
  { chars: "Čč", sound: "ch · ч", example: "čodar", meaning: "bedsheet · простыня" },
  { chars: "Êê", sound: "э", example: "mênat", meaning: "effort · труд" },
  { chars: "Ůů", sound: "ū · ӯ", example: "ůn", meaning: "yes · да" },
  { chars: "Āā", sound: "ā", example: "āga / agā", meaning: "if · если / пробужд." },
  { chars: "Ẋẋ", sound: "х̌", example: "ẋac", meaning: "water · вода" },
  { chars: "Ɣɣ", sound: "ғ", example: "ɣulla", meaning: "big · большой" },
  { chars: "Ɣ̌ɣ̌", sound: "гь", example: "ɣ̌inik", meaning: "woman · женщина" },
  { chars: "Ӡʓ", sound: "зь", example: "ʓulik", meaning: "small · маленький" },
  { chars: "Δδ", sound: "дь", example: "δusten", meaning: "arms · руки" },
  { chars: "Ɵϑ", sound: "тh", example: "ϑir", meaning: "ash · пепел" },
];

interface PamiriKeyboardProps {
  script: "latin" | "cyrillic";
  onKeyPress: (char: string) => void;
}

export function PamiriKeyboard({ script, onKeyPress }: PamiriKeyboardProps) {
  const [showGuide, setShowGuide] = useState(false);
  const rows = script === "latin" ? LATIN_SPECIAL : CYRILLIC_SPECIAL;

  return (
    <div className="bg-muted/60 border border-border rounded-xl overflow-hidden" data-testid="pamiri-keyboard">
      {showGuide ? (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Xuɣ̌nůnê arfen · Шугнанский алфавит
            </p>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowGuide(false)}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X size={15} />
            </button>
          </div>
          <div className="space-y-1.5">
            {CHAR_GUIDE.map(({ chars, sound, example, meaning }) => (
              <div key={chars} className="flex items-center gap-2 text-xs">
                <span className="font-bold text-sm w-9 shrink-0">{chars}</span>
                <span className="text-muted-foreground w-10 shrink-0">{sound}</span>
                <span className="font-medium shrink-0">{example}</span>
                <span className="text-muted-foreground truncate">— {meaning}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-2 space-y-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-center gap-1">
              {row.map((char) => (
                <Button
                  key={char}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 min-w-[38px] px-2 text-sm font-medium"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onKeyPress(char)}
                  data-testid={`key-${char}`}
                >
                  {char}
                </Button>
              ))}
            </div>
          ))}
          {script === "latin" && (
            <div className="flex justify-center pt-0.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5"
              >
                <BookOpen size={12} />
                Xuɣ̌nůnê arfen — как писать буквы
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
