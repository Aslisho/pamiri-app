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
import HomePage from "@/pages/home";
import LearnPage from "@/pages/learn";
import AddPage from "@/pages/add";
import DictionaryPage from "@/pages/dictionary";
import RanksPage from "@/pages/ranks";
import ProfilePage from "@/pages/profile";
import ModPage from "@/pages/mod";

function AppRouter() {
  const { isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return (
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }

  return (
    <>
      <TopBar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/home" component={HomePage} />
        <Route path="/learn" component={LearnPage} />
        <Route path="/add" component={AddPage} />
        <Route path="/dictionary" component={DictionaryPage} />
        <Route path="/ranks" component={RanksPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/mod" component={ModPage} />
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
