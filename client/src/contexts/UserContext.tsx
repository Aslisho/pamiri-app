import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isLoggedIn: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isLoggedIn: !!user }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
