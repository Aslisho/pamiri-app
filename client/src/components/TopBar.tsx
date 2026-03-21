import { Link } from "wouter";
import { Moon, Sun, Shield, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZivLogo } from "./ZivLogo";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function TopBar() {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
        <Link href="/home">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="logo-link">
            {/* Branded logo container */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ea580c 100%)",
                boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
              }}
            >
              <ZivLogo size={18} />
            </div>
            <span className="font-black text-base tracking-tight">Deve</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="h-8 px-2 text-xs font-bold gap-1"
            data-testid="lang-toggle"
            title={lang === "ru" ? "Переключить язык" : lang === "sgh" ? "Switch language" : "Забонро иваз кунед"}
          >
            <Languages size={14} />
            {lang === "ru" ? t("lang.ru") : lang === "sgh" ? t("lang.sgh") : t("lang.tj")}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8"
            data-testid="theme-toggle"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {user.role === "moderator" && (
            <Link href="/mod">
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="mod-link">
                <Shield size={16} />
              </Button>
            </Link>
          )}

          <Link href="/profile">
            <button
              data-testid="profile-link"
              className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ea580c 100%)",
                boxShadow: "0 2px 8px rgba(249,115,22,0.30)",
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
