import { Link, useLocation } from "wouter";
import { BookOpen, PlusCircle, Search, Trophy, UserCircle } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const tabs: { path: string; icon: typeof BookOpen; labelKey: TranslationKey; center?: boolean }[] = [
  { path: "/learn", icon: BookOpen, labelKey: "nav.learn" },
  { path: "/dictionary", icon: Search, labelKey: "nav.dictionary" },
  { path: "/add", icon: PlusCircle, labelKey: "nav.add", center: true },
  { path: "/ranks", icon: Trophy, labelKey: "nav.ranks" },
  { path: "/profile", icon: UserCircle, labelKey: "nav.profile" },
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
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 ${
                  tab.center ? "relative -top-3" : ""
                } ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:scale-105"}`}
              >
                {tab.center ? (
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 ${
                    isActive ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-foreground shadow-md"
                  }`}>
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
                <span className={`text-[10px] font-medium ${tab.center ? "mt-0.5" : ""}`}>{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
