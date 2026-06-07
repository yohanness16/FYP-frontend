import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "BusTrack Admin",
  description: "Real-time public transport tracking, density prediction & fleet management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>{children}</AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
