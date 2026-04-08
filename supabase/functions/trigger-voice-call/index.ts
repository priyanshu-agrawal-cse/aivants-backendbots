import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Supabase Edge Function to trigger a Personaplex Voice AI call.
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Client for authenticating the caller
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // 2. Parse request body
    const { to_number, from_number, persona_id, context, campaign_id, lead_id } = await req.json();

    if (!to_number || !from_number || !context) {
      throw new Error("Missing required fields: to_number, from_number, context");
    }

    // 3. Get Credentials
    const personaplexUrl = Deno.env.get("PERSONAPLEX_API_URL");
    const vobizAuthId = Deno.env.get("VOBIZ_AUTH_ID");
    const vobizAuthToken = Deno.env.get("VOBIZ_AUTH_TOKEN");

    if (!personaplexUrl || (!vobizAuthId && personaplexUrl)) {
      // NOTE: We only strictly check personaplexUrl if falling back. For full Vobiz use, we need Vobiz keys.
      if (!vobizAuthId) throw new Error("Vobiz integration NOT configured in Supabase secrets (VOBIZ_AUTH_ID)");
    }

    // 4. Trigger call via Vobiz API (Vobiz originates the call and bridges to Personaplex via Webhook)
    const response = await fetch(`https://api.vobiz.ai/api/v1/account/${vobizAuthId}/calls`, {
      method: "POST",
      headers: {
        "X-Auth-ID": vobizAuthId,
        "X-Auth-Token": vobizAuthToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: to_number,
        from: from_number,
        webhook_url: `${personaplexUrl}/v1/vobiz/webhook`, 
        custom_data: {
          persona_id: persona_id || "default_persona",
          context: context,
          aivants_webhook_url: `${Deno.env.get("AIVANTS_API_URL") || "https://api.aivants.com"}/api/webhooks/personaplex`
        }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Vobiz API Error:", result);
      throw new Error(result.error || `Vobiz dialing error: ${response.status}`);
    }

    const call_id = result.call_id || result.id || `vobiz_${Date.now()}`;

    // 5. Log the triggered call in our database
    const serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: dbError } = await serviceRoleClient
      .from("voice_calls")
      .insert({
        user_id: user.id,
        campaign_id: campaign_id || null,
        call_id: call_id,
        to_number: to_number,
        from_number: from_number,
        persona_id: persona_id || "default_persona",
        status: "triggered",
        created_at: new Date().toISOString()
      });

    if (dbError) console.error("Database log error:", dbError);

    return new Response(JSON.stringify({ 
      success: true, 
      call_id: call_id,
      message: `Voice call triggered to ${to_number}` 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
