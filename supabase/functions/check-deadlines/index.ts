import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get projects with deadlines approaching (7, 3, 1 days) and team_notifications = true
    const today = new Date();
    const checkDays = [1, 3, 7];

    const targetDates = checkDays.map((d) => {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      return { days: d, date: date.toISOString().split("T")[0] };
    });

    const notifications: { project: string; deadline: string; daysLeft: number; emails: string[] }[] = [];

    for (const target of targetDates) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, deadline, user_id")
        .eq("team_notifications", true)
        .eq("deadline", target.date)
        .neq("status", "completed");

      if (!projects || projects.length === 0) continue;

      for (const project of projects) {
        // Get team member emails for this project
        const { data: assignments } = await supabase
          .from("project_team_assignments")
          .select("team_members(email, name)")
          .eq("project_id", project.id);

        if (!assignments || assignments.length === 0) continue;

        const emails = assignments
          .map((a: any) => a.team_members?.email)
          .filter(Boolean);

        if (emails.length === 0) continue;

        notifications.push({
          project: project.name,
          deadline: project.deadline,
          daysLeft: target.days,
          emails,
        });

        // Send email via SendGrid if configured
        if (sendgridApiKey) {
          // Get user settings for from_email
          const { data: settings } = await supabase
            .from("user_settings")
            .select("from_email")
            .eq("user_id", project.user_id)
            .single();

          const fromEmail = settings?.from_email || "noreply@aivants.com";

          for (const email of emails) {
            const memberName = assignments.find(
              (a: any) => a.team_members?.email === email
            )?.team_members?.name || "Team Member";

            await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${sendgridApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                personalizations: [{ to: [{ email }] }],
                from: { email: fromEmail, name: "Aivants" },
                subject: `Project Deadline Approaching: ${project.name}`,
                content: [
                  {
                    type: "text/html",
                    value: `
                      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Project Deadline Approaching</h2>
                        <p>Hi ${memberName},</p>
                        <p>This is a reminder that the following project deadline is approaching:</p>
                        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                          <p style="margin: 0;"><strong>Project:</strong> ${project.name}</p>
                          <p style="margin: 8px 0 0;"><strong>Deadline:</strong> ${project.deadline}</p>
                          <p style="margin: 8px 0 0;"><strong>Time Remaining:</strong> ${target.days} day${target.days > 1 ? "s" : ""}</p>
                        </div>
                        <p>Please ensure all tasks are completed on time.</p>
                        <p>Best regards,<br/>Aivants System</p>
                      </div>
                    `,
                  },
                ],
              }),
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notifications.length,
        details: notifications,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
