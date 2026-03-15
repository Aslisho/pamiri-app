import { Link, useLocation } from "wouter";
import { Home, BookOpen, PlusCircle, Search, Trophy } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

const tabs = [
  { path: "/home", icon: Home, label: "Главная" },
  { path: "/learn", icon: BookOpen, label: "Учить" },
  { path: "/add", icon: PlusCircle, label: "Добавить", center: true },
  { path: "/dictionary", icon: Search, label: "Словарь" },
  { path: "/ranks", icon: Trophy, label: "Рейтинг" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useUser();

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;
          return (
            <Link key={tab.path} href={tab.path}>
              <button
                data-testid={`nav-${tab.label.toLowerCase()}`}
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
                <span className={`text-[10px] font-medium ${tab.center ? "mt-0.5" : ""}`}>{tab.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
