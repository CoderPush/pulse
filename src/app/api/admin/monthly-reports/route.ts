import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    // TODO: Add robust admin check here. For now, we rely on the fact that this is an admin route
    // and we might want to restrict it further if we had a role system.

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const id = searchParams.get("id");

    let query = supabase
        .from("monthly_reports")
        .select(`
      *,
      user:users!monthly_reports_user_id_fkey (
        email,
        name
      )
    `)
        .order("submitted_at", { ascending: false });

    if (id) {
        query = query.eq("id", id);
    }

    if (month) {
        query = query.eq("month", month);
    }

    if (status) {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching monthly reports:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }

    return NextResponse.json({ reports: data });
}
