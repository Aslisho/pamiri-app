import { Link, useLocation } from "wouter";
import { Home, BookOpen, PlusCircle, Search, Trophy } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const tabs: { path: string; icon: typeof Home; labelKey: TranslationKey; center?: boolean }[] = [
  { path: "/home", icon: Home, labelKey: "nav.home" },
  { path: "/learn", icon: BookOpen, labelKey: "nav.learn" },
  { path: "/add", icon: PlusCircle, labelKey: "nav.add", center: true },
  { path: "/dictionary", icon: Search, labelKey: "nav.dictionary" },
  { path: "/ranks", icon: Trophy, labelKey: "nav.ranks" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useUser();
  const { t } = useLanguage();

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border" data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;
          const label = t(tab.labelKey);
          return (
            <Link key={tab.path} href={tab.path}>
              <button
                data-testid={`nav-${tab.labelKey}`}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                  tab.center ? "relative -top-3" : ""
                } ${isActive && !tab.center ? "text-primary" : !isActive ? "text-muted-foreground hover:text-foreground hover:scale-105" : ""}`}
              >
                {tab.center ? (
                  <div
                    className="flex items-center justify-center w-13 h-13 w-[52px] h-[52px] rounded-full transition-all duration-200 hover:scale-105 active:scale-95 text-white"
                    style={isActive ? {
                      background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ea580c 100%)",
                      boxShadow: "0 4px 20px rgba(249,115,22,0.45), 0 1px 4px rgba(0,0,0,0.2)",
                    } : {
                      background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ea580c 100%)",
                      boxShadow: "0 2px 10px rgba(249,115,22,0.30)",
                      opacity: 0.82,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon size={20} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                )}
                <span className={`text-[10px] font-medium ${tab.center ? "mt-0.5 text-foreground/70" : ""}`}>{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
