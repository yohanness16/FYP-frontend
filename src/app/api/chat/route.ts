import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ ENV ERROR: GEMINI_API_KEY is missing");
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  try {
    const { message, history, systemPrompt } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);

    // Using 'gemini-1.5-flash' or 'gemini-1.5-flash-latest'
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite", 
      systemInstruction: systemPrompt 
    });

    // Ensure history follows the User -> Model -> User pattern
    const formattedHistory = (history || [])
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }))
      .filter((m: any, index: number) => {
        // Remove leading 'model' messages (like the greeting)
        if (index === 0 && m.role === "model") return false;
        return true;
      });

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // If you get a 404 again, it might be a regional restriction 
    // disguised as a model error.
    return NextResponse.json({ 
      error: "Gemini Error", 
      details: error.message 
    }, { status: 500 });
  }
}