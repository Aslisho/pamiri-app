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
          <div className="flex items-center gap-2 cursor-pointer" data-testid="logo-link">
            <ZivLogo size={28} />
            <span className="font-semibold text-base tracking-tight">Deve</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {/* Language toggle — cycles ru → sgh → tj → ru */}
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
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold"
            >
              {user.displayName.charAt(0).toUpperCase()}
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
