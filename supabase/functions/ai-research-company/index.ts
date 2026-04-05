import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine URL to scrape
    const websiteUrl = lead.website || lead.url || null;
    if (!websiteUrl) {
      return new Response(JSON.stringify({ error: "Lead has no website or URL to research" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured. Connect Firecrawl in Settings." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format URL
    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping website:", formattedUrl);

    // Scrape website with Firecrawl
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "summary"],
        onlyMainContent: true,
      }),
    });

    if (!scrapeResponse.ok) {
      const errData = await scrapeResponse.text();
      console.error("Firecrawl error:", errData);
      return new Response(JSON.stringify({ error: "Failed to scrape website", details: errData }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const summary = scrapeData.data?.summary || scrapeData.summary || "";

    if (!markdown && !summary) {
      return new Response(JSON.stringify({ error: "No content could be extracted from the website" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Website scraped, analyzing with AI...");

    // Analyze with AI
    const analysisPrompt = `Analyze this company's website content and provide structured intelligence for B2B sales outreach.

Company: ${lead.company_name || "Unknown"}
Industry: ${lead.industry || "Unknown"}
Location: ${lead.location || lead.address || "Unknown"}
Contact: ${lead.first_name} ${lead.last_name || ""}

Website Summary: ${summary}

Website Content (first 3000 chars):
${markdown.substring(0, 3000)}

Analyze and extract the following intelligence:`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a B2B sales intelligence analyst. Extract actionable company intelligence from website content. Be specific and concise. Focus on signals useful for personalized outreach.",
          },
          { role: "user", content: analysisPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_intelligence",
              description: "Extract structured company intelligence",
              parameters: {
                type: "object",
                properties: {
                  website_summary: {
                    type: "string",
                    description: "Brief 2-3 sentence summary of what the company does",
                  },
                  services: {
                    type: "string",
                    description: "Key services or products offered, comma-separated",
                  },
                  growth_signals: {
                    type: "string",
                    description: "Signs of growth: new products, expanding locations, recent achievements. Say 'No clear signals' if none found.",
                  },
                  hiring_signals: {
                    type: "string",
                    description: "Any hiring/team growth indicators from the content. Say 'No hiring signals' if none found.",
                  },
                  marketing_activity: {
                    type: "string",
                    description: "Blog activity, content marketing, social presence indicators",
                  },
                  industry_focus: {
                    type: "string",
                    description: "Specific industry verticals or market segments they focus on",
                  },
                  outreach_angle: {
                    type: "string",
                    description: "Best angle to approach this company for outreach, based on their current situation",
                  },
                  ai_opening_line: {
                    type: "string",
                    description: "A personalized email opening line (1-2 sentences) that references something specific about the company. Address the contact by first name.",
                  },
                },
                required: [
                  "website_summary", "services", "growth_signals", "hiring_signals",
                  "marketing_activity", "industry_focus", "outreach_angle", "ai_opening_line",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_intelligence" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let intelligence: Record<string, string>;
    if (toolCall) {
      intelligence = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback
      const content = aiData.choices?.[0]?.message?.content || "";
      intelligence = {
        website_summary: summary || content.substring(0, 200),
        services: "",
        growth_signals: "",
        hiring_signals: "",
        marketing_activity: "",
        industry_focus: lead.industry || "",
        outreach_angle: "",
        ai_opening_line: `Hi ${lead.first_name}, I came across ${lead.company_name || "your company"} and was impressed by what I saw.`,
      };
    }

    // Save to database using service role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert - delete old intelligence for this lead first
    await serviceClient
      .from("company_intelligence")
      .delete()
      .eq("lead_id", lead_id)
      .eq("user_id", user.id);

    const { data: saved, error: saveError } = await serviceClient
      .from("company_intelligence")
      .insert({
        lead_id,
        user_id: user.id,
        company_id: lead.company_id || null,
        ...intelligence,
        raw_data: { markdown_length: markdown.length, summary, url: formattedUrl },
        researched_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      return new Response(JSON.stringify({ error: "Failed to save intelligence", details: saveError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Intelligence saved for lead:", lead_id);

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
