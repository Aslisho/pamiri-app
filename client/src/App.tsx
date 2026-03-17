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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <LanguageProvider>
            <TooltipProvider>
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
