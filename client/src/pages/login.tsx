import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ZivLogo } from "@/components/ZivLogo";
import { useUser } from "@/contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { setUser } = useUser();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [script, setScript] = useState<"latin" | "cyrillic">("latin");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        username: username.trim(),
        password,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setError(null);
      setUser(data);
      navigate("/home");
    },
    onError: (err: Error) => {
      try {
        const body = JSON.parse(err.message.substring(err.message.indexOf("{")));
        setError(body.error || "Что-то пошло не так");
      } catch {
        setError("Неверное имя пользователя или пароль");
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        password,
        preferredLanguage: "ru",
        preferredScript: script,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setError(null);
      setUser(data);
      navigate("/home");
    },
    onError: (err: Error) => {
      try {
        const body = JSON.parse(err.message.substring(err.message.indexOf("{")));
        setError(body.error || "Что-то пошло не так");
      } catch {
        setError("Ошибка регистрации");
      }
    },
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const canSubmit =
    username.trim().length > 0 &&
    password.length >= (mode === "register" ? 6 : 1);

  const handleSubmit = () => {
    setError(null);
    if (mode === "login") {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo + Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <ZivLogo size={56} />
          </div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="app-title">Deve</h1>
          <p className="text-sm text-muted-foreground">
            Учи памирский шугнанский язык
          </p>
        </div>

        <Card className="border-border/60">
          <CardContent className="pt-6 space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Имя пользователя</label>
              <Input
                data-testid="input-username"
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
              />
            </div>

            {/* Display Name - register only */}
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Отображаемое имя</label>
                <Input
                  placeholder="Как вас называть? (необязательно)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Пароль</label>
              <Input
                data-testid="input-password"
                type="password"
                placeholder={mode === "register" ? "Минимум 6 символов" : "Введите пароль"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
              />
            </div>

            {/* Script Selection - register only */}
            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Памирское письмо
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={script === "latin" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setScript("latin")}
                    data-testid="script-latin"
                    className="h-9"
                  >
                    Латиница
                  </Button>
                  <Button
                    type="button"
                    variant={script === "cyrillic" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setScript("cyrillic")}
                    data-testid="script-cyrillic"
                    className="h-9"
                  >
                    Кириллица
                  </Button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-destructive text-xs text-center" data-testid="login-error">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              data-testid="button-login"
              className="w-full h-12 text-base font-semibold"
              disabled={!canSubmit || isPending}
              onClick={handleSubmit}
            >
              {isPending
                ? "..."
                : mode === "login"
                  ? "Войти"
                  : "Зарегистрироваться"}
            </Button>

            {/* Toggle mode */}
            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Нет аккаунта?{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline font-medium"
                    onClick={() => { setMode("register"); setError(null); }}
                  >
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline font-medium"
                    onClick={() => { setMode("login"); setError(null); }}
                  >
                    Войти
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
