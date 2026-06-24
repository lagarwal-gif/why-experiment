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

    const { data, error } = await supabase
      .from("exchanges")
      .select(
        `
        sent_date, status, original_answer, followup_question, followup_answer,
        subscriber_id, question_id,
        subscribers:subscriber_id (phone_number),
        questions:question_id (text)
      `
      )
      .order("sent_date", { ascending: false });

    if (error) throw error;

    const rows = data?.map((ex) => [
      (ex.subscribers as any)?.phone_number || "",
      ex.sent_date,
      (ex.questions as any)?.text || "",
      ex.original_answer || "",
      ex.followup_question || "",
      ex.followup_answer || "",
      ex.status,
    ]);

    const csv = [
      ["Phone Number", "Date", "Question", "Answer", "Follow-up Q", "Follow-up A", "Status"],
      ...(rows || []),
    ]
      .map((row) =>
        row
          .map((cell) => {
            if (typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n"))) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(",")
      )
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=why-responses.csv",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
