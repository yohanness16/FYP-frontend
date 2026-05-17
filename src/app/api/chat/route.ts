import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  message?: string;
  history?: ChatMessage[];
  systemPrompt?: string;
};

const FALLBACK_PREFIX = "BusTrack assistant (fallback)";

function buildFallbackReply(message: string) {
  const q = message.toLowerCase();
  if (q.includes("register") && q.includes("bus")) {
    return `${FALLBACK_PREFIX}: To register a bus, open Vehicles -> Register Vehicle, then provide plate number and device ID.`;
  }
  if (q.includes("eta") && q.includes("ml")) {
    return `${FALLBACK_PREFIX}: ML ETA uses learned patterns from trip history. Heuristic ETA uses distance + dwell + peak multipliers.`;
  }
  if (q.includes("occupancy") || q.includes("density")) {
    return `${FALLBACK_PREFIX}: Occupancy levels are 0=Low, 1=Medium, 2=High based on telemetry density estimates.`;
  }
  return `${FALLBACK_PREFIX}: I can help with vehicles, routes, assignments, ML ETA, and analytics. Ask a specific BusTrack admin question.`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const message = (body.message || "").trim();
    const systemPrompt = (body.systemPrompt || "").trim();
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: buildFallbackReply(message), mode: "fallback" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const transcript = history
      .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
      .join("\n");

    const prompt = `${systemPrompt}\n\nConversation so far:\n${transcript}\nUser: ${message}\nAssistant:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim();

    if (!text) {
      return NextResponse.json({ text: "I could not generate a response right now." }, { status: 200 });
    }

    return NextResponse.json({ text, mode: "gemini" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Chat request failed", detail }, { status: 500 });
  }
}
