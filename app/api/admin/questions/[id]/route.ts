import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.has("admin_session");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { text, is_active } = await request.json();

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from("questions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ question: data }, { status: 200 });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
