import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert restaurant interior designer and space planner. Given details about a restaurant space, provide a detailed design plan.

CRITICAL RULES:
1. Base all suggestions on the provided square footage, style preference, and any photo analysis.
2. Be specific and actionable. Give exact placement suggestions (e.g., "place the bar along the north wall").
3. For budget tips, prioritize cost-effective solutions that still look premium.
4. If a photo was provided, reference specific visible elements (wall colors, flooring, ceiling height, existing fixtures).

Output valid JSON matching this schema exactly:
{
  "layout": "<string - detailed 3-4 sentence description of where to place bar, kitchen, seating areas, restrooms, and flow>",
  "moodBoard": [
    "<string - Color palette suggestion with 3-4 specific colors/hex values and why>",
    "<string - Materials and textures suggestion with specific materials and surfaces>",
    "<string - Lighting plan with types of fixtures and placement>"
  ],
  "budgetTips": [
    "<string - specific budget tip 1>",
    "<string - specific budget tip 2>",
    "<string - specific budget tip 3>"
  ],
  "referenceDescriptions": [
    "<string - detailed description of a real-world reference interior for this style, including specific design elements, colors, and layout features>",
    "<string - detailed description of a second real-world reference interior>",
    "<string - detailed description of a third real-world reference interior>"
  ]
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { squareFootage, style, notes, image } = body;

    if (!squareFootage || squareFootage <= 0) {
      return NextResponse.json({ error: "Square footage is required and must be positive" }, { status: 400 });
    }
    if (!style || typeof style !== "string") {
      return NextResponse.json({ error: "Style preference is required" }, { status: 400 });
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey || openAIKey === "your_openai_api_key_here") {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    const spaceContext = `Restaurant Space Details:
- Square Footage: ${squareFootage} sq ft
- Style Preference: ${style}
${notes ? `- Additional Notes: ${notes}` : ""}`;

    const openai = new OpenAI({ apiKey: openAIKey });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (image && typeof image === "string") {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Analyze this photo of a restaurant space and create a design plan.\n\n${spaceContext}` },
          { type: "image_url", image_url: { url: image, detail: "high" } },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Create a restaurant interior design plan based on the following:\n\n${spaceContext}`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("Empty response from AI design analysis");
    }

    const designPlan = JSON.parse(result);
    return NextResponse.json({
      ...designPlan,
      meta: { squareFootage, style, photoAnalyzed: !!image },
    });
  } catch (error) {
    console.error("Design Analysis Error:", error);
    const message = error instanceof Error ? error.message : "Design analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
