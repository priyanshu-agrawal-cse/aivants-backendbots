// Shared Telegram notification helper — used by other edge functions
// Import pattern: copy the sendTelegramNotification function into your edge function

export type NotifCategory = "replies" | "meetings" | "campaigns";

export async function sendTelegramNotification(
  serviceClient: any,
  userId: string,
  message: string,
  category?: NotifCategory
) {
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!BOT_TOKEN) return;

  const { data: telegramUser } = await serviceClient
    .from("telegram_users")
    .select("telegram_chat_id, notification_prefs")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!telegramUser?.telegram_chat_id) return;

  // Check notification preferences
  if (category && telegramUser.notification_prefs) {
    const prefs = telegramUser.notification_prefs;
    if (prefs[category] === false) return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramUser.telegram_chat_id,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}
