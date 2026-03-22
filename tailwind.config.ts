import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Satoshi","DM Sans","system-ui","sans-serif"],
        mono: ["JetBrains Mono","monospace"],
      },
      animation: {
        "fade-in":"fadeIn .3s ease",
        "slide-up":"slideUp .35s ease",
        "pulse-ring":"pulseRing 2s infinite",
        "spin":"spin 1s linear infinite",
        "pulse":"pulse 2s cubic-bezier(.4,0,.6,1) infinite",
      },
      keyframes: {
        fadeIn:{from:{opacity:"0"},to:{opacity:"1"}},
        slideUp:{from:{opacity:"0",transform:"translateY(12px)"},to:{opacity:"1",transform:"translateY(0)"}},
        pulseRing:{"0%,100%":{boxShadow:"0 0 0 0 rgba(14,165,233,.4)"},"50%":{boxShadow:"0 0 0 8px rgba(14,165,233,0)"}},
      },
    },
  },
  plugins: [],
};
export default config;
