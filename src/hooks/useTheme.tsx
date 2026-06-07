"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
interface ThemeCtx { theme: Theme; toggle: () => void }
const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(t);
  };

  useEffect(() => {
    const saved = (typeof window !== "undefined" ? localStorage.getItem("bustrack-theme") : null) as Theme | null;
    const t = saved || "dark";
    setTheme(t);
    applyTheme(t);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("bustrack-theme", next);
    applyTheme(next);
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
