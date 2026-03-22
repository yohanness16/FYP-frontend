"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
interface ThemeCtx { theme: Theme; toggle: () => void }
const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("bustrack-theme") as Theme) || "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
    document.documentElement.classList.toggle("light", saved === "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("bustrack-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
