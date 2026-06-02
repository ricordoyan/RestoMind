import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/places";
import type { MenuItem } from "@/lib/store";

type IncomingMessage = { role: "user" | "assistant"; content: string };

type OrderLineItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderPayload = {
  items: OrderLineItem[];
  total: number;
  status: "in_progress" | "confirmed";
};

type AgentResponse = {
  reply: string;
  order: OrderPayload;
};

const SYSTEM_PROMPT = `You are a warm, efficient phone host taking a takeout order for a restaurant. Speak naturally and briefly, like on a real call. ONLY offer and accept dishes from the MENU provided (with their prices); if a caller asks for something not on the menu, say it's unavailable and suggest the closest menu item. Always confirm quantities. Never invent prices — use the menu price. When the caller indicates they are finished and you've read back the order, mark it confirmed.

Respond ONLY with a JSON object in exactly this shape:
{
  "reply": "<what the host says next, spoken style>",
  "order": {
    "items": [ { "name": "<menu dish name>", "qty": <int>, "unitPrice": <number>, "lineTotal": <number> } ],
    "total": <number>,
    "status": "in_progress" | "confirmed"
  }
}

Rules:
- "order.items" reflects the full current cart every turn. Use an empty array if nothing has been ordered yet.
- "order.status" is "in_progress" until the caller clearly confirms they are done and you have read back the full order to them — then set it to "confirmed".
- unitPrice MUST match the menu price exactly. lineTotal = unitPrice * qty. total = sum of all lineTotals.
- Never add items not on the menu.`;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { messages: IncomingMessage[]; menu: MenuItem[] };
    const { messages, menu } = body;

    if (!Array.isArray(menu) || menu.length === 0) {
      return NextResponse.json(
        { error: "menu must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 }
      );
    }

    // Build menu context appended to system prompt
    const menuJson = JSON.stringify(
      menu.map((m) => ({ name: m.name, price: m.price, category: m.category ?? undefined }))
    );
    const systemContent = `${SYSTEM_PROMPT}\n\nMENU (JSON):\n${menuJson}`;

    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemContent },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw || !raw.trim()) {
      throw new Error("Empty response from AI agent");
    }

    const parsed = JSON.parse(raw) as AgentResponse;
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Order Agent API Error:", error);
    const message =
      error instanceof Error ? error.message : "Order agent request failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
