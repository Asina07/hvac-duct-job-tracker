import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define what our store holds
interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  //     Without persist — if user refreshes the page, Zustand forgets everything and user gets logged out.
  // With persist — Zustand automatically saves state to localStorage and restores it on page refresh. User stays logged in!
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      // Called after successful login
      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      // Called on logout
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage", // localStorage key name
    },
  ),
);
