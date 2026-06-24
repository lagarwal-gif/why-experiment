import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { normalizeToE164 } from "@/lib/phone";
import { sendSMS } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeToE164(phoneNumber);

    const { data: subscriber, error: subscribeError } = await supabase
      .from("subscribers")
      .upsert(
        {
          phone_number: normalizedPhone,
          is_active: true,
          unsubscribed_at: null,
        },
        { onConflict: "phone_number" }
      )
      .select()
      .single();

    if (subscribeError) throw subscribeError;

    const { data: profile, error: profileError } = await supabase
      .from("subscriber_profiles")
      .upsert(
        {
          subscriber_id: subscriber.id,
        },
        { onConflict: "subscriber_id" }
      )
      .select()
      .single();

    if (profileError) throw profileError;

    const onboardingMessage =
      "Hey, this is Why! We're on a mission to understand what drives human decisions. We'd love to learn about you. Feel free to tell us a bit about yourself, share your LinkedIn, what you're working on — whatever feels right. No pressure to be formal. 😊";

    await sendSMS(normalizedPhone, onboardingMessage);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
