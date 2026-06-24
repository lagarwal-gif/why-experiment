import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilio";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: question, error: qError } = await supabase
      .from("questions")
      .select()
      .eq("is_active", true)
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(1)
      .single();

    if (qError || !question) {
      return NextResponse.json(
        { error: "No active questions available" },
        { status: 400 }
      );
    }

    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select()
      .eq("is_active", true);

    if (subError) throw subError;

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const subscriber of subscribers || []) {
      try {
        const today = new Date().toISOString().split("T")[0];

        const { error: insertError } = await supabase
          .from("exchanges")
          .insert({
            subscriber_id: subscriber.id,
            question_id: question.id,
            sent_date: today,
            status: "sent",
          });

        if (insertError) {
          if (insertError.code === "23505") {
            skipped++;
          } else {
            throw insertError;
          }
          continue;
        }

        await sendSMS(subscriber.phone_number, question.text);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${subscriber.phone_number}:`, err);
        failed++;
      }
    }

    await supabase
      .from("questions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", question.id);

    return NextResponse.json(
      { sent, failed, skipped, questionId: question.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
