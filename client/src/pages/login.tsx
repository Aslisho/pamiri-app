import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password || undefined,
          preferredLanguage: "ru",
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка входа");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      navigate("/home");
    },
    onError: () => {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    },
  });

  return (
    <div className="login-bg min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative floating blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 -right-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-32 h-32 rounded-full bg-orange-400/10 blur-2xl"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="w-full max-w-sm space-y-8 relative z-10">
        {/* Logo + Title */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="flex justify-center"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/10 backdrop-blur-sm">
              <ZivLogo size={72} />
            </div>
          </motion.div>
          <motion.h1
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent"
            data-testid="app-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Deve
          </motion.h1>
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Учи памирский шугнанский язык
          </motion.p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-border/60 backdrop-blur-sm bg-card/90 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                {/* Username */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Имя пользователя
                  </label>
                  <Input
                    data-testid="input-username"
                    placeholder="Введите ваше имя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                    onKeyDown={(e) => e.key === "Enter" && document.getElementById("password-input")?.focus()}
                  />
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Пароль
                  </label>
                  <div className="relative">
                    <Input
                      id="password-input"
                      data-testid="input-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 text-base pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                      onKeyDown={(e) => e.key === "Enter" && username.trim() && loginMutation.mutate()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Новый пользователь? Просто введите имя и пароль для регистрации
                  </p>
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    data-testid="button-login"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    disabled={!username.trim() || loginMutation.isPending}
                    onClick={() => loginMutation.mutate()}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="animate-spin mr-2" size={18} />
                    ) : null}
                    {loginMutation.isPending ? "Вход..." : "Сарам чуд — Войти!"}
                  </Button>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {loginMutation.isError && (
                    <motion.p
                      className="text-destructive text-xs text-center font-medium"
                      data-testid="login-error"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {loginMutation.error?.message || "Что-то пошло не так"}
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          className="text-center text-[10px] text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Сохраняя язык Памира — одно слово за раз
        </motion.p>
      </div>
    </div>
  );
}
