import { Camera, Eye } from "lucide-react";

interface CameraFeedProps {
    imagePath: string | null;
    peopleCount: number;
    method: string;
    confidence: number;
    foregroundRatio: number;
    apiBaseUrl: string;
}

export function CameraFeed({ imagePath, peopleCount, method, confidence, foregroundRatio, apiBaseUrl }: CameraFeedProps) {
    const imageUrl = imagePath ? `${apiBaseUrl}/${imagePath}` : null;

    return (
        <div className="card-glow p-5">
            <div className="flex items-center gap-2 mb-4">
                <Camera className="h-4 w-4" style={{ color: "var(--text3)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    ESP32-CAM Feed
                </span>
                <div
                    className="ml-auto w-2 h-2 rounded-full"
                    style={{
                        background: imageUrl ? "var(--neon)" : "var(--danger)",
                        boxShadow: imageUrl ? "var(--glow-neon)" : "none",
                        animation: imageUrl ? "pulseGlow 2s infinite" : "none",
                    }}
                />
            </div>

            {/* Image frame */}
            <div
                className="relative rounded-lg overflow-hidden mb-4"
                style={{
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                    aspectRatio: "16/10",
                }}
            >
                {imageUrl ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt="Bus interior camera feed"
                            className="w-full h-full object-cover"
                            style={{ filter: "brightness(0.9) contrast(1.05)" }}
                        />
                        {/* Overlay */}
                        <div className="absolute top-2 left-2 flex gap-1.5">
                            <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded"
                                style={{ background: "rgba(0,0,0,0.7)", color: "var(--neon)", backdropFilter: "blur(4px)" }}
                            >
                                <Eye className="inline h-3 w-3 mr-1" />{peopleCount} people
                            </span>
                        </div>
                        <div className="absolute bottom-2 right-2">
                            <span
                                className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(0,0,0,0.7)", color: "var(--text3)" }}
                            >
                                {method} • {Math.round(confidence * 100)}%
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6">
                        <Camera className="h-10 w-10 mb-2" style={{ color: "var(--text3)", opacity: 0.3 }} />
                        <p className="text-xs font-medium" style={{ color: "var(--text3)" }}>No camera feed</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text3)", opacity: 0.6 }}>
                            Waiting for ESP32-CAM frames
                        </p>
                    </div>
                )}
            </div>

            {/* CV Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg text-center" style={{ background: "var(--bg3)" }}>
                    <p className="text-lg font-bold" style={{ color: "var(--neon)" }}>{peopleCount}</p>
                    <p className="text-[9px] uppercase" style={{ color: "var(--text3)" }}>People</p>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ background: "var(--bg3)" }}>
                    <p className="text-lg font-bold" style={{ color: "var(--neon-b)" }}>
                        {Math.round(confidence * 100)}%
                    </p>
                    <p className="text-[9px] uppercase" style={{ color: "var(--text3)" }}>Confidence</p>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ background: "var(--bg3)" }}>
                    <p className="text-lg font-bold" style={{ color: "var(--neon-p)" }}>
                        {Math.round(foregroundRatio * 100)}%
                    </p>
                    <p className="text-[9px] uppercase" style={{ color: "var(--text3)" }}>FG Ratio</p>
                </div>
            </div>
        </div>
    );
}
