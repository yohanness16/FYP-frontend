import React, { type ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "green" | "red" | "amber" | "blue" | "purple" | "gray";
  className?: string;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default: { background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)" },
  green: { background: "var(--neon-dim)", color: "var(--neon)", border: "1px solid rgba(0,255,136,0.3)" },
  red: { background: "var(--neon-r-dim)", color: "var(--danger)", border: "1px solid rgba(255,34,85,0.3)" },
  amber: { background: "rgba(255,184,0,0.1)", color: "var(--warning)", border: "1px solid rgba(255,184,0,0.3)" },
  blue: { background: "var(--neon-b-dim)", color: "var(--neon-b)", border: "1px solid rgba(0,136,255,0.3)" },
  purple: { background: "rgba(191,0,255,0.1)", color: "var(--neon-p)", border: "1px solid rgba(191,0,255,0.3)" },
  gray: { background: "var(--bg4)", color: "var(--text3)", border: "1px solid var(--border)" },
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={`badge ${className || ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        ...VARIANT_STYLES[variant],
      }}
    >
      {children}
    </span>
  );
}
