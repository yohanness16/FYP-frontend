"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bus,
  Eye,
  EyeOff,
  LockIcon,
  UserIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FloatingPaths } from "@/components/floating-paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BusTrackLogin() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "driver") {
        router.replace("/bus-dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Invalid credentials"
      );
    } finally {
      setBusy(false);
    }
  };

  const apiHost = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/^https?:\/\//, "");

  return (
    <main className="relative min-h-screen lg:grid lg:grid-cols-2 lg:overflow-hidden">
      <div className="relative hidden h-full flex-col border-r border-border bg-secondary/40 p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Bus className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">BusTrack</p>
            <p className="text-xs uppercase tracking-widest text-primary">Admin Console</p>
          </div>
        </div>

        <div className="relative z-10 mt-auto space-y-6">
          <blockquote className="space-y-3">
            <p className="text-xl leading-relaxed">
              Real-time fleet intelligence for Addis Ababa — live GPS, occupancy
              monitoring, and ML-powered ETA predictions.
            </p>
            <footer className="text-sm font-medium text-muted-foreground">
              Transit operations dashboard
            </footer>
          </blockquote>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              "GPS outlier rejection",
              "ML vs heuristic ETAs",
              "Crowd density CV",
              "WebSocket live fleet",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Bus className="size-4" />
            </div>
            <span className="font-display text-lg font-bold">BusTrack</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Use your admin or operator credentials
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  className="pl-9"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  className="pl-9 pr-10"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              API connected
            </span>
            <code className="font-mono">{apiHost}</code>
          </div>
        </div>
      </div>
    </main>
  );
}
