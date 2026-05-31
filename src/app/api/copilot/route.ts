import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/places";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the Operations Copilot inside Restaurant Co-Pilot — an expert, practical restaurant operations manager and consultant. Help with food cost, recipes, inventory & ordering, menu engineering, staffing & scheduling, training, marketing, compliance and day-to-day operations. Be concise and actionable: prefer short paragraphs and bullet points. Give concrete numbers/benchmarks (e.g. target food cost 28-35%, labour 25-35% of sales) when relevant, but clearly label rules of thumb as estimates. You do NOT have live POS/sales data — if asked for the user's actual numbers, say so and explain how they can find or calculate them. If the user gave restaurant context, use it.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, context } = body as {
      messages: ChatMessage[];
      context?: { restaurantName?: string; cuisine?: string };
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages must be a non-empty array" },
        { status: 400 }
      );
    }

    const last = messages[messages.length - 1];
    if (last.role !== "user" || !last.content || !last.content.trim()) {
      return NextResponse.json(
        { error: "The last message must be a non-empty user message" },
        { status: 400 }
      );
    }

    // Cap history to last 16 messages
    const history = messages.slice(-16);

    const openai = getOpenAIClient();

    let systemContent = SYSTEM_PROMPT;
    if (context?.restaurantName || context?.cuisine) {
      const parts: string[] = [];
      if (context.restaurantName) parts.push(`Restaurant name: ${context.restaurantName}`);
      if (context.cuisine) parts.push(`Cuisine type: ${context.cuisine}`);
      systemContent += `\n\nUser's restaurant context — ${parts.join(", ")}.`;
    }

    const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemContent },
      ...history,
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatMessages,
      temperature: 0.5,
      max_tokens: 900,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      throw new Error("Empty response from AI copilot");
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Copilot API Error:", error);
    const message =
      error instanceof Error ? error.message : "Copilot request failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
