"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, ArrowRight, Wifi, Shield } from "lucide-react";

export default function BusDashboardEntryPage() {
    const router = useRouter();
    const [busId, setBusId] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!busId.trim()) return;
        router.push(`/bus-dashboard/${encodeURIComponent(busId.trim())}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.03]"
                    style={{ background: "radial-gradient(circle, var(--neon), transparent 70%)" }} />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.03]"
                    style={{ background: "radial-gradient(circle, var(--neon-b), transparent 70%)" }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center relative"
                        style={{
                            background: "linear-gradient(135deg, var(--neon-dim), transparent)",
                            border: "1px solid var(--border2)",
                            boxShadow: "var(--neon-glow)",
                        }}>
                        <Bus className="h-12 w-12" style={{ color: "var(--neon)" }} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                            style={{ background: "var(--neon)", boxShadow: "var(--glow-neon)", animation: "pulseGlow 2s infinite" }} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "var(--text)" }}>
                        BusTrack
                    </h1>
                    <p className="text-sm mt-2" style={{ color: "var(--text3)" }}>
                        Real-Time Bus Monitoring Dashboard
                    </p>
                </div>

                {/* Entry card */}
                <div className="card-glow p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="label">Bus Vehicle ID</label>
                            <div className="relative">
                                <input
                                    className="input pl-11 text-base"
                                    style={{ height: 48 }}
                                    placeholder="Enter bus ID (e.g. 12)"
                                    value={busId}
                                    onChange={(e) => setBusId(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <Bus className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "var(--text3)" }} />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary w-full justify-center" style={{ height: 48, fontSize: 15 }}>
                            Open Bus Dashboard
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    <div className="neon-line mt-8 mb-6" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2.5 p-3 rounded-lg" style={{ background: "var(--bg3)" }}>
                            <Wifi className="h-4 w-4" style={{ color: "var(--neon)" }} />
                            <div>
                                <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>Live GPS</p>
                                <p className="text-[10px]" style={{ color: "var(--text3)" }}>Real-time tracking</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-3 rounded-lg" style={{ background: "var(--bg3)" }}>
                            <Shield className="h-4 w-4" style={{ color: "var(--neon-b)" }} />
                            <div>
                                <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>Secured</p>
                                <p className="text-[10px]" style={{ color: "var(--text3)" }}>JWT authenticated</p>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-6 text-[11px]" style={{ color: "var(--text3)" }}>
                    Smart Transport — Real-time Public Transport Tracking & Density Prediction
                </p>
            </div>
        </div>
    );
}
