import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();

    const systemPrompt = `You are AutoSouq AI, a friendly and knowledgeable car-finding assistant for AutoSouq — a premium online car marketplace operating in the UK, US, Pakistan, and UAE.

Your capabilities:
- Help users find cars based on their budget, preferences, and needs
- Explain AutoSouq features: verified listings, finance checks, HPI checks, MOT history
- Guide sellers through listing their car
- Answer questions about car buying, selling, financing
- Recommend body types based on lifestyle needs

Key URLs to reference:
- Browse cars: /browse
- Sell your car: /sell-my-car
- Car valuation: /valuation
- Dealers: /dealers
- Help: /help

Keep responses concise (2-4 sentences). Be helpful, professional, and enthusiastic about cars. If asked about pricing, direct them to browse listings. Never make up specific car listings or prices.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ reply: "I'm being set up — please try again in a moment!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Try asking another way!";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return new Response(
      JSON.stringify({ reply: "Something went wrong. Please try again!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
