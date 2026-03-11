import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { room, nickname, content, file_url } = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get VAPID keys
    const { data: config } = await supabase.from("push_config").select("*").eq("id", 1).single();

    if (!config) {
      return new Response(JSON.stringify({ error: "VAPID not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails("mailto:push@cjbchat.lovable.app", config.public_key, config.private_key);

    // Get all subscriptions except sender's
    const { data: subs } = await supabase.from("push_subscriptions").select("*").neq("nickname", nickname);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine body text
    const isObscure = content?.startsWith("[OBSCURE]");
    let body: string;
    if (isObscure) {
      body = "🔒 Secret message";
    } else if (content) {
      body = content.length > 100 ? content.slice(0, 100) + "…" : content;
    } else if (file_url) {
      body = "📷 Image";
    } else {
      body = "New message";
    }

    const payload = JSON.stringify({
      title: `${nickname} in Room ${room}`,
      body,
      data: {
        room,
        url: `/room/${room}`,
      },
    });

    const expired: string[] = [];

    const results = await Promise.allSettled(
      subs
        .filter((sub) => {
          const isMentioned = content?.includes(`@${sub.nickname}`);
          return sub.notify_all || (sub.notify_mentions && isMentioned);
        })
        .map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth_key },
              },
              payload,
            );
          } catch (err: any) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              expired.push(sub.id);
            }
            throw err;
          }
        })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expired);
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
