import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert restaurant marketing strategist specializing in social media, brand identity, and grand opening campaigns. Given a restaurant concept, generate a complete marketing toolkit.

CRITICAL RULES:
1. Social media captions must be short, punchy, and use relevant emojis naturally.
2. Include a mix of engagement-focused, food-showcase, and behind-the-scenes captions.
3. The logo concept must be descriptive enough for a designer to execute.
4. The grand opening promotion must be specific and actionable.
5. The 30-day checklist must be broken into daily/weekly actionable items.

Output valid JSON matching this schema exactly:
{
  "socialCaptions": [
    {
      "platform": "Instagram" or "TikTok",
      "caption": "<string - the post caption with hashtags and emojis>",
      "contentIdea": "<string - what the image/video should show>"
    }
  ],
  "logoConcept": {
    "style": "<string - overall logo style and philosophy>",
    "typography": "<string - font recommendations and rationale>",
    "colors": "<string - color palette with hex values>",
    "imagery": "<string - icon/symbol/illustration description>",
    "mockupDescription": "<string - how the logo would look on a storefront, menu, and social media>"
  },
  "grandOpening": {
    "eventName": "<string - catchy name for the opening event>",
    "dateIdea": "<string - recommended day/time and why>",
    "promotionDetails": "<string - 3-4 sentences describing the promotion>",
    "specialOffers": [
      "<string - specific offer 1>",
      "<string - specific offer 2>",
      "<string - specific offer 3>"
    ],
    "marketingChannels": [
      "<string - channel 1 and what to post>",
      "<string - channel 2 and what to post>"
    ]
  },
  "marketingChecklist": [
    {
      "week": "Week 1: Pre-Launch",
      "tasks": [
        "<string - actionable task 1>",
        "<string - actionable task 2>",
        "<string - actionable task 3>",
        "<string - actionable task 4>"
      ]
    },
    {
      "week": "Week 2: Soft Launch",
      "tasks": ["<string>", "<string>", "<string>"]
    },
    {
      "week": "Week 3: Grand Opening",
      "tasks": ["<string>", "<string>", "<string>"]
    },
    {
      "week": "Week 4: Retention & Growth",
      "tasks": ["<string>", "<string>", "<string>"]
    }
  ]
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, concept, targetCustomers, location, cuisine } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    }
    if (!concept || typeof concept !== "string" || !concept.trim()) {
      return NextResponse.json({ error: "Concept description is required" }, { status: 400 });
    }
    if (!targetCustomers || typeof targetCustomers !== "string" || !targetCustomers.trim()) {
      return NextResponse.json({ error: "Target customers is required" }, { status: 400 });
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey || openAIKey === "your_openai_api_key_here") {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    const context = `Restaurant Details:
- Name: ${name}
- Concept: ${concept}
- Target Customers: ${targetCustomers}
${location ? `- Location: ${location}` : ""}
${cuisine ? `- Cuisine: ${cuisine}` : ""}

Generate a complete marketing toolkit for this restaurant. Tailor all content to the ${concept} concept and ${targetCustomers} audience.`;

    const openai = new OpenAI({ apiKey: openAIKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2500,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("Empty response from AI marketing analysis");
    }

    const marketingPlan = JSON.parse(result);
    return NextResponse.json({
      ...marketingPlan,
      meta: { name, concept, targetCustomers, location: location || null, cuisine: cuisine || null },
    });
  } catch (error) {
    console.error("Marketing Analysis Error:", error);
    const message = error instanceof Error ? error.message : "Marketing analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
