import React, { useState } from "react";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [script, setScript] = useState<"latin" | "cyrillic">("latin");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        username: username.trim(),
        password: password.trim(),
        preferredLanguage: "ru",
        preferredScript: script,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Что-то пошло не так");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      navigate("/home");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    loginMutation.mutate();
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <Input
                data-testid="input-username"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 text-center text-base"
                autoComplete="username"
              />

              {/* Password */}
              <Input
                data-testid="input-password"
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-center text-base"
                autoComplete="current-password"
              />
            </form>

            {/* Script Selection */}
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

            {/* Submit */}
            <Button
              data-testid="button-login"
              className="w-full h-12 text-base font-semibold"
              disabled={!username.trim() || !password.trim() || loginMutation.isPending}
              onClick={() => loginMutation.mutate()}
            >
              {loginMutation.isPending ? "..." : "Сарам чуд — Начнём!"}
            </Button>

            {loginMutation.isError && (
              <p className="text-destructive text-xs text-center" data-testid="login-error">
                {(loginMutation.error as Error)?.message || "Что-то пошло не так"}
              </p>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              Новый пользователь? Введите имя и придумайте пароль (мин. 4 символа)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
