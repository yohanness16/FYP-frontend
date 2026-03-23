import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });

  try {
    const { message, history, systemPrompt } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite", systemInstruction: systemPrompt });

    const formattedHistory = (history || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((m: any, index: number) => !(index === 0 && m.role === "model"));

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(message);
    return NextResponse.json({ text: result.response.text() });
  } catch (error: unknown) {
    console.error("Gemini error:", error);
    return NextResponse.json({ error: "AI error", details: (error as Error).message }, { status: 500 });
  }
}
