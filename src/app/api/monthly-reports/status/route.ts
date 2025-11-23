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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month) {
        return new NextResponse(JSON.stringify({ error: "Month is required" }), {
            status: 400,
        });
    }

    const { data, error } = await supabase
        .from("monthly_reports")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", month)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "The result contains 0 rows"
        console.error("Error fetching monthly report status:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }

    return NextResponse.json({ report: data });
}
