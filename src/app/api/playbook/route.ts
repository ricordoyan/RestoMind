import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/places";

const SYSTEM_PROMPT = `You are a restaurant operations & training director with deep expertise in HACCP food-safety, daily operations, and staff development. Produce a practical, customized operations playbook for the given cuisine type and service style. All tasks must be concrete and station-specific. Food-safety procedures must reflect general HACCP best-practice; note that local health codes vary and operators should verify requirements with their local authority.

Return valid JSON matching this schema exactly:
{
  "overview": "<string — 2-3 sentence summary of the playbook tailored to the cuisine and service style>",
  "checklists": [
    {
      "title": "<string — e.g. Opening Checklist, Closing Checklist, Weekly Deep-Clean>",
      "frequency": "daily" | "weekly" | "monthly",
      "tasks": [
        { "task": "<string — concrete actionable task>", "station": "<string — e.g. Kitchen, FOH, Bar, Storage>" }
      ]
    }
  ],
  "foodSafety": [
    { "procedure": "<string — procedure name>", "detail": "<string — 1-2 sentences describing the HACCP-aligned steps>" }
  ],
  "trainingModules": [
    {
      "role": "<string — e.g. Server, Line Cook, Host, Manager>",
      "modules": [
        {
          "title": "<string — module title>",
          "objectives": ["<string — learning objective>"],
          "durationMins": <number>
        }
      ]
    }
  ],
  "onboardingPlan": [
    {
      "day": "<string — e.g. Day 1, Day 2-3>",
      "focus": "<string — high-level theme for the day>",
      "activities": ["<string — specific activity>"]
    }
  ],
  "complianceNotes": ["<string — compliance or regulatory note>"]
}

Requirements:
- checklists: include at minimum an Opening checklist (daily), a Closing checklist (daily), and one Weekly checklist.
- foodSafety: provide 5-7 HACCP-aligned procedures relevant to the cuisine.
- trainingModules: cover at least Server, Line Cook, and Manager roles.
- onboardingPlan: first-week plan with approximately 5 entries.
- complianceNotes: 3-5 notes reminding operators to verify local codes.`;

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      restaurantName?: string;
      cuisine?: string;
      serviceStyle?: string;
      teamSize?: number;
      notes?: string;
    };

    const { restaurantName, cuisine, serviceStyle, teamSize, notes } = body;

    if (!cuisine || typeof cuisine !== "string" || !cuisine.trim()) {
      return NextResponse.json({ error: "Cuisine type is required" }, { status: 400 });
    }
    if (!serviceStyle || typeof serviceStyle !== "string" || !serviceStyle.trim()) {
      return NextResponse.json({ error: "Service style is required" }, { status: 400 });
    }

    const openai = getOpenAIClient();

    const userContent = [
      restaurantName ? `Restaurant Name: ${restaurantName.trim()}` : null,
      `Cuisine: ${cuisine.trim()}`,
      `Service Style: ${serviceStyle.trim()}`,
      teamSize ? `Team Size: ${teamSize} staff members` : null,
      notes ? `Additional Notes: ${notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 3000,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("Empty response from AI playbook generation");
    }

    const modelJson = JSON.parse(result) as Record<string, unknown>;

    return NextResponse.json({
      ...modelJson,
      meta: {
        restaurantName: restaurantName?.trim() || null,
        cuisine: cuisine.trim(),
        serviceStyle: serviceStyle.trim(),
        teamSize: teamSize || null,
      },
    });
  } catch (error) {
    console.error("Playbook Generation Error:", error);
    const message = error instanceof Error ? error.message : "Playbook generation failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
