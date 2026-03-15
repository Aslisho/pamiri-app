import { Button } from "@/components/ui/button";

const LATIN_SPECIAL = [
  ["č", "đ", "ê", "ğ", "ġ", "š", "þ"],
  ["ū", "ů", "ẋ", "ž", "ā", "ē", "ī", "ō"],
];

const CYRILLIC_SPECIAL = [
  ["ғ", "гь", "дъ", "ӣ", "қ"],
  ["тъ", "ҳ", "хь", "ч̣"],
];

interface PamiriKeyboardProps {
  script: "latin" | "cyrillic";
  onKeyPress: (char: string) => void;
}

export function PamiriKeyboard({ script, onKeyPress }: PamiriKeyboardProps) {
  const rows = script === "latin" ? LATIN_SPECIAL : CYRILLIC_SPECIAL;

  return (
    <div className="bg-muted/50 border-t border-border p-2 space-y-1.5" data-testid="pamiri-keyboard">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-center gap-1">
          {row.map((char) => (
            <Button
              key={char}
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 min-w-[36px] px-2 text-sm font-medium"
              onClick={() => onKeyPress(char)}
              data-testid={`key-${char}`}
            >
              {char}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}
