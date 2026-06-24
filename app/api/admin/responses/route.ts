import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.has("admin_session");
}

export async function GET(request: NextRequest) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const date = searchParams.get("date");

    let query = supabase
      .from("exchanges")
      .select(
        `
        id, sent_date, status, original_answer, original_answer_at,
        followup_question, followup_sent_at, followup_answer, followup_answer_at,
        subscriber_id, question_id,
        subscribers:subscriber_id (phone_number),
        questions:question_id (text)
      `
      )
      .order("sent_date", { ascending: false });

    if (phone) {
      const { data: sub } = await supabase
        .from("subscribers")
        .select("id")
        .eq("phone_number", phone)
        .single();
      if (sub) query = query.eq("subscriber_id", sub.id);
    }

    if (date) {
      query = query.eq("sent_date", date);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formatted = data?.map((ex) => ({
      id: ex.id,
      phoneNumber: (ex.subscribers as any)?.phone_number,
      sentDate: ex.sent_date,
      questionText: (ex.questions as any)?.text,
      originalAnswer: ex.original_answer,
      followupQuestion: ex.followup_question,
      followupAnswer: ex.followup_answer,
      status: ex.status,
    }));

    return NextResponse.json({ exchanges: formatted }, { status: 200 });
  } catch (error) {
    console.error("Responses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
