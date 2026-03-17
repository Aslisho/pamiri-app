import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ZivLogo } from "@/components/ZivLogo";
import { BookOpen, Users, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Stats {
  wordCount: number;
  userCount: number;
}

const FLOATING_WORDS = [
  { sgh: "Salōmolek!", ru: "Привет!" },
  { sgh: "Walek!", ru: "Ответ на привет" },
  { sgh: "Carang taw awōl?", ru: "Как дела?" },
  { sgh: "Tu nōm cī?", ru: "Как тебя зовут?" },
  { sgh: "wūz", ru: "Я" },
  { sgh: "taw", ru: "Ты" },
  { sgh: "jūr", ru: "Ладно" },
  { sgh: "Sarām čūd", ru: "Начнём" },
  { sgh: "Tu fāmēyo?", ru: "Ты знаешь?" },
  { sgh: "wadh", ru: "Они" },
];

type Bubble = {
  id: number;
  word: typeof FLOATING_WORDS[0];
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
};

const COLORS = [
  "from-amber-500/30 to-orange-600/20 border-amber-400/40",
  "from-rose-500/25 to-pink-600/15 border-rose-400/35",
  "from-violet-500/25 to-purple-600/15 border-violet-400/35",
  "from-sky-500/25 to-blue-600/15 border-sky-400/35",
  "from-emerald-500/25 to-teal-600/15 border-emerald-400/35",
  "from-yellow-500/30 to-amber-600/20 border-yellow-400/40",
];

function FloatingBubble({ bubble }: { bubble: Bubble }) {
  return (
    <div
      className="absolute rounded-full select-none pointer-events-none flex flex-col items-center justify-center"
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        width: `${bubble.size}px`,
        height: `${bubble.size}px`,
        animation: `float${bubble.id % 3} ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
        background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",
        border: "1.5px solid rgba(255,255,255,0.25)",
        boxShadow: "inset 0 1px 8px rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.25)",
        backdropFilter: "blur(6px)",
      }}
    >
      <span style={{
        fontSize: `${bubble.size * 0.22}px`,
        fontWeight: 800,
        color: "rgba(255,255,255,0.95)",
        lineHeight: 1.1,
        textAlign: "center",
        textShadow: "0 1px 8px rgba(0,0,0,0.4)",
        padding: "0 8px",
      }}>{bubble.word.sgh}</span>
      <span style={{
        fontSize: `${bubble.size * 0.13}px`,
        color: "rgba(255,255,255,0.5)",
        lineHeight: 1.2,
        textAlign: "center",
        marginTop: 2,
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
      size: 100 + (i * 19) % 50,
      duration: 5 + (i * 3) % 5,
      delay: (i * 0.7) % 4,
      color: COLORS[i % COLORS.length],
    }));
    setBubbles(generated);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900" />

      {/* Radial glow spots */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

      {/* Floating word bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} bubble={b} />
        ))}
      </div>

      {/* CSS animations injected */}
      <style>{`
        @keyframes float0 {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-18px) rotate(1deg); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-24px) rotate(-1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1.5deg); }
          66% { transform: translateY(-20px) rotate(-1deg); }
        }
      `}</style>

      {/* Main content card */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center">
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
            <ZivLogo size={48} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tight">Deve</h1>
            <p className="text-amber-400/90 text-sm font-medium tracking-widest uppercase mt-1">
              Памирский язык
            </p>
          </div>
        </div>

        {/* Mission statement */}
        <div className="text-center mb-8 px-2">
          <p className="text-white/90 text-lg font-semibold leading-snug">
            Сохраним шугнанский язык вместе
          </p>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">
            Вносите слова, учитесь вместе, сохраняйте живым язык предков.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex gap-4 mb-8 w-full justify-center">
            <div className="flex-1 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm px-4 py-3 flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <BookOpen size={14} className="text-amber-400" />
                <span className="text-xl font-black text-white">{stats.wordCount.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-white/50">слов</span>
            </div>
            <div className="flex-1 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm px-4 py-3 flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users size={14} className="text-violet-400" />
                <span className="text-xl font-black text-white">{stats.userCount.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-white/50">участников</span>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Link href="/login" className="w-full">
            <button className="w-full h-13 py-3.5 rounded-2xl font-bold text-base text-white
              bg-gradient-to-r from-amber-500 to-orange-600
              shadow-lg shadow-amber-500/30
              hover:shadow-amber-500/50 hover:scale-[1.02]
              active:scale-[0.98] transition-all duration-200
              flex items-center justify-center gap-2">
              <Sparkles size={18} />
              Войти / Зарегистрироваться
            </button>
          </Link>
          <Link href="/dictionary" className="w-full">
            <button className="w-full h-13 py-3.5 rounded-2xl font-semibold text-base text-white/90
              bg-white/10 border border-white/20 backdrop-blur-sm
              hover:bg-white/15 hover:scale-[1.02]
              active:scale-[0.98] transition-all duration-200
              flex items-center justify-center gap-2">
              <BookOpen size={18} />
              Просмотр словаря
            </button>
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-white/30 text-center leading-relaxed max-w-[260px]">
          Шугнанский — памирский язык Таджикистана и Афганистана. Вместе мы можем его сохранить.
        </p>
      </div>
    </div>
  );
}
