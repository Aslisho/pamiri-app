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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;
          const label = t(tab.labelKey);
          return (
            <Link key={tab.path} href={tab.path}>
              <button
                data-testid={`nav-${tab.labelKey}`}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  tab.center ? "relative -top-3" : ""
                } ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab.center ? (
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}>
                    <Icon size={22} />
                  </div>
                ) : (
                  <Icon size={20} />
                )}
                <span className={`text-[10px] font-medium ${tab.center ? "mt-0.5" : ""}`}>{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
