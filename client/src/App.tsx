import { Suspense, lazy, type ComponentType } from "react";
import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

const LandingPage = lazy(() => import("@/pages/landing"));
const HomePage = lazy(() => import("@/pages/home"));
const LearnPage = lazy(() => import("@/pages/learn"));
const AddPage = lazy(() => import("@/pages/add"));
const DictionaryPage = lazy(() => import("@/pages/dictionary"));
const RanksPage = lazy(() => import("@/pages/ranks"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const ModPage = lazy(() => import("@/pages/mod"));

function PageFallback() {
  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <div className="pt-4 text-sm text-muted-foreground">Загрузка…</div>
    </div>
  );
}

function lazyWrap(C: ComponentType) {
  return function LazyWrapped() {
    return (
      <Suspense fallback={<PageFallback />}>
        <C />
      </Suspense>
    );
  };
}

function AppRouter() {
  const { isLoggedIn, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Switch>
        <Route path="/" component={lazyWrap(LandingPage)} />
        <Route path="/login" component={LoginPage} />
        <Route path="/dictionary" component={lazyWrap(DictionaryPage)} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }

  return (
    <>
      <TopBar />
      <Switch>
        <Route path="/" component={() => <Redirect to="/home" />} />
        <Route path="/home" component={lazyWrap(HomePage)} />
        <Route path="/learn" component={lazyWrap(LearnPage)} />
        <Route path="/add" component={lazyWrap(AddPage)} />
        <Route path="/dictionary" component={lazyWrap(DictionaryPage)} />
        <Route path="/ranks" component={lazyWrap(RanksPage)} />
        <Route path="/profile" component={lazyWrap(ProfilePage)} />
        <Route path="/mod" component={lazyWrap(ModPage)} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </>
  );
}

function AppBackground() {
  return (
    <div className="fixed inset-0 -z-10 hidden dark:block">
      {/* Base gradient: deep purple-navy matching brand */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0f0720 0%, #1a0d3a 50%, #0d0a1e 100%)" }} />
      {/* Ambient glow spots */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full pointer-events-none" style={{ background: "rgba(245,158,11,0.07)", filter: "blur(64px)" }} />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(139,92,246,0.10)", filter: "blur(64px)" }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" style={{ background: "rgba(88,28,135,0.08)", filter: "blur(80px)" }} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <LanguageProvider>
            <TooltipProvider>
              <AppBackground />
              <Toaster />
              <Router hook={useHashLocation}>
                <AppRouter />
              </Router>
            </TooltipProvider>
          </LanguageProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
