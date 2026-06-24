import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendSMS, validateTwilioRequest } from "@/lib/twilio";
import { decideFollowup } from "@/lib/followup";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;

    const signature = request.headers.get("X-Twilio-Signature") || "";
    const url = request.url;

    if (signature) {
      const isValid = validateTwilioRequest(
        process.env.TWILIO_AUTH_TOKEN!,
        signature,
        url,
        Object.fromEntries(formData)
      );

      if (!isValid) {
        console.warn("Invalid Twilio signature");
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      console.log("Dev mode: skipping Twilio signature validation");
    }

    const stopKeywords = ["STOP", "UNSUBSCRIBE", "CANCEL"];
    if (stopKeywords.some((kw) => body.toUpperCase().includes(kw))) {
      const { error } = await supabase
        .from("subscribers")
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq("phone_number", from);
      if (error) console.error("Unsubscribe error:", error);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { data: subscriber, error: subError } = await supabase
      .from("subscribers")
      .select()
      .eq("phone_number", from)
      .single();

    if (subError || !subscriber) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { data: exchanges, error: exError } = await supabase
      .from("exchanges")
      .select()
      .eq("subscriber_id", subscriber.id)
      .order("sent_date", { ascending: false })
      .limit(1);

    if (exError) {
      console.error("Query error:", exError);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!exchanges || exchanges.length === 0) {
      const { error: profileError } = await supabase
        .from("subscriber_profiles")
        .update({ onboarding_response: body })
        .eq("subscriber_id", subscriber.id);
      if (profileError) console.error("Profile update error:", profileError);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const latestExchange = exchanges[0];

    if (latestExchange.status === "sent") {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("exchanges")
        .update({
          original_answer: body,
          original_answer_at: now,
          status: "answered",
        })
        .eq("id", latestExchange.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const { data: question, error: qError } = await supabase
        .from("questions")
        .select()
        .eq("id", latestExchange.question_id)
        .single();

      if (qError || !question) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      try {
        const decision = await decideFollowup(question.text, body);

        if (decision.needsFollowup && decision.followupQuestion) {
          const followupTime = new Date().toISOString();
          await supabase
            .from("exchanges")
            .update({
              followup_question: decision.followupQuestion,
              followup_sent_at: followupTime,
              status: "followup_sent",
            })
            .eq("id", latestExchange.id);

          await sendSMS(from, decision.followupQuestion);
        } else {
          await supabase
            .from("exchanges")
            .update({ status: "completed" })
            .eq("id", latestExchange.id);
        }
      } catch (claudeError) {
        console.error("Claude error:", claudeError);
        await supabase
          .from("exchanges")
          .update({ status: "completed" })
          .eq("id", latestExchange.id);
      }
    } else if (latestExchange.status === "followup_sent") {
      const now = new Date().toISOString();
      await supabase
        .from("exchanges")
        .update({
          followup_answer: body,
          followup_answer_at: now,
          status: "completed",
        })
        .eq("id", latestExchange.id);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
