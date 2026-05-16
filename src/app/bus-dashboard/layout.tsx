"use client";

import { useEffect } from "react";

export default function BusDashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("light");
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {children}
    </div>
  );
}
