import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ZivLogo } from "@/components/ZivLogo";
import { BookOpen, Users, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface Stats {
  wordCount: number;
  userCount: number;
}

const FLOATING_WORDS = [
  { sgh: "Salōmolek!", ru: "Привет!" },
  { sgh: "Wālek!", ru: "Ответ на привет" },
  { sgh: "Carang tu awōl?", ru: "Как дела?" },
  { sgh: "Tu nōm chāy?", ru: "Как тебя зовут?" },
  { sgh: "Wūz", ru: "Я" },
  { sgh: "Tu", ru: "Ты" },
  { sgh: "Jūr", ru: "Ладно" },
  { sgh: "Sarām čūd", ru: "Начнём" },
  { sgh: "Tu fāmēyo?", ru: "Ты знаешь?" },
  { sgh: "Wāth", ru: "Они" },
];

type Bubble = {
  id: number;
  word: typeof FLOATING_WORDS[0];
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

function FloatingBubble({ bubble }: { bubble: Bubble }) {
  return (
    <div
      className="absolute rounded-full select-none pointer-events-none flex flex-col items-center justify-center"
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        width: `${bubble.size}px`,
        height: `${bubble.size}px`,
        animation: `floatBubble${bubble.id % 3} ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
        background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.14), rgba(255,255,255,0.03))",
        border: "1.5px solid rgba(255,255,255,0.18)",
        boxShadow: "inset 0 1px 12px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <span style={{
        fontSize: `${bubble.size * 0.21}px`,
        fontWeight: 800,
        color: "rgba(255,255,255,0.92)",
        lineHeight: 1.1,
        textAlign: "center",
        textShadow: "0 1px 10px rgba(0,0,0,0.5)",
        padding: "0 10px",
        letterSpacing: "-0.01em",
      }}>{bubble.word.sgh}</span>
      <span style={{
        fontSize: `${bubble.size * 0.12}px`,
        color: "rgba(255,255,255,0.42)",
        lineHeight: 1.3,
        textAlign: "center",
        marginTop: 3,
        fontWeight: 500,
      }}>{bubble.word.ru}</span>
    </div>
  );
}

export default function LandingPage() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      return res.json();
    },
  });

  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const generated: Bubble[] = FLOATING_WORDS.map((word, i) => ({
      id: i,
      word,
      x: 5 + (i * 37 + i * i * 13) % 82,
      y: 5 + (i * 29 + i * i * 7) % 85,
      size: 105 + (i * 19) % 55,
      duration: 6 + (i * 3) % 5,
      delay: (i * 0.7) % 4,
    }));
    setBubbles(generated);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0720] via-[#1a0d3a] to-[#0d0a1e]" />

      {/* Ambient glow spots */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-amber-500/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-violet-600/12 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-800/8 blur-3xl pointer-events-none" />
      <div className="absolute top-3/4 left-1/4 w-48 h-48 rounded-full bg-orange-500/6 blur-2xl pointer-events-none" />

      {/* Floating word bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} bubble={b} />
        ))}
      </div>

      {/* Bubble float animations */}
      <style>{`
        @keyframes floatBubble0 {
          0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
          50% { transform: translateY(-20px) rotate(1.5deg); }
        }
        @keyframes floatBubble1 {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-28px) rotate(-1deg); }
        }
        @keyframes floatBubble2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-14px) rotate(2deg); }
          66% { transform: translateY(-22px) rotate(-1.5deg); }
        }
      `}</style>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center">

        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-5 mb-8">
          <div
            className="w-24 h-24 rounded-[28px] flex items-center justify-center text-white shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #f97316 55%, #ea580c 100%)",
              boxShadow: "0 8px 40px rgba(249,115,22,0.45), 0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <ZivLogo size={52} />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black text-white tracking-tight leading-none">Deve</h1>
            <p
              className="text-sm font-semibold tracking-[0.2em] uppercase mt-2"
              style={{ color: "#f59e0b" }}
            >
              Памирский язык
            </p>
            <p className="text-xs text-white/35 mt-1 tracking-wider">Pamiri Language</p>
          </div>
        </div>

        {/* Mission statement */}
        <div className="text-center mb-8 px-2">
          <p className="text-white/90 text-lg font-bold leading-snug">
            Сохраним языки вместе.
          </p>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">
            Вносите слова, учитесь вместе, сохраняйте язык живым.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex gap-3 mb-8 w-full">
            <div
              className="flex-1 rounded-2xl px-4 py-3.5 flex flex-col items-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <BookOpen size={13} style={{ color: "#f59e0b" }} />
                <span className="text-2xl font-black text-white leading-none">{stats.wordCount.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-white/40 font-medium">слов</span>
            </div>
            <div
              className="flex-1 rounded-2xl px-4 py-3.5 flex flex-col items-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users size={13} style={{ color: "#a78bfa" }} />
                <span className="text-2xl font-black text-white leading-none">{stats.userCount.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-white/40 font-medium">участников</span>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Link href="/login" className="w-full">
            <button
              className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ea580c 100%)",
                boxShadow: "0 4px 24px rgba(249,115,22,0.40), 0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              <Sparkles size={17} />
              Войти / Зарегистрироваться
            </button>
          </Link>
          <Link href="/dictionary" className="w-full">
            <button
              className="w-full py-4 rounded-2xl font-semibold text-base text-white/80 flex items-center justify-center gap-2 transition-all duration-200 hover:bg-white/[0.12] active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
              }}
            >
              <BookOpen size={17} />
              Просмотр словаря
            </button>
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-[11px] text-white/25 text-center tracking-wide">
          Шугнанский — памирский язык.
        </p>
      </div>
    </div>
  );
}
