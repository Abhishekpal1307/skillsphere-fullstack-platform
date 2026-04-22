import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, currentName } = await req.json();
    if (!resumeText || typeof resumeText !== "string") {
      return new Response(JSON.stringify({ error: "resumeText is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const trimmed = resumeText.slice(0, 18000);

    const systemPrompt = `You are an expert technical recruiter and resume writer.
Extract structured profile data from a developer's resume.
- Skills: technical skills only (languages, frameworks, tools, cloud, databases). Normalize names (e.g. "reactjs" -> "React"). Max 25, deduped, ordered by importance.
- Bio: a confident, concise 2-3 sentence personal pitch in first person, optimized for job-matching. No clichés ("passionate", "team player"). Highlight stack + years of experience + domain.
- experience_level: one of "junior" (0-2y), "mid" (2-5y), "senior" (5-9y), "lead" (10y+ or staff/principal/lead title).
- full_name: extract if present, else null.
Return ONLY via the extract_profile tool.`;

    const userPrompt = `Resume:\n"""\n${trimmed}\n"""\n${currentName ? `Existing name on file: ${currentName}` : ""}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_profile",
              description: "Return extracted skills, bio, experience level, and name from a resume.",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string", description: "Candidate full name, or empty if unknown." },
                  bio: { type: "string", description: "2-3 sentence first-person pitch." },
                  skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Normalized technical skills.",
                  },
                  experience_level: {
                    type: "string",
                    enum: ["junior", "mid", "senior", "lead"],
                  },
                },
                required: ["bio", "skills", "experience_level"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_profile" } },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No extraction returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(call.function.arguments);

    // Sanitize
    const skills = Array.isArray(args.skills)
      ? Array.from(new Set(args.skills.map((s: unknown) => String(s).trim()).filter(Boolean))).slice(0, 25)
      : [];
    const bio = typeof args.bio === "string" ? args.bio.trim().slice(0, 600) : "";
    const full_name = typeof args.full_name === "string" && args.full_name.trim() ? args.full_name.trim().slice(0, 80) : null;
    const experience_level = ["junior", "mid", "senior", "lead"].includes(args.experience_level)
      ? args.experience_level : "junior";

    return new Response(JSON.stringify({ full_name, bio, skills, experience_level }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
