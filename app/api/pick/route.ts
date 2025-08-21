import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE!;
const supabase = createClient(url, service, { auth: { persistSession: false } });

const LEAGUE = process.env.LEAGUE_ID || "default";

// Body: { email, name, week, matchNumber, pick }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, week, matchNumber, pick } = body as {
      email: string; name: string; week: number; matchNumber: number; pick: '1'|'X'|'2';
    };

    if (!email || !name || !week || !matchNumber || !pick) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("states")
      .select("data")
      .eq("league", LEAGUE)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "League not initialized" }, { status: 400 });

    const state = (data as any).data ?? data;

    if (!state.picks[email]) state.picks[email] = { name, weeks: {} };
    if (!state.picks[email].weeks[week]) state.picks[email].weeks[week] = {};
    state.picks[email].weeks[week][matchNumber] = pick;
    state.updatedAt = new Date().toISOString();

    const { error: updErr } = await supabase.from("states").upsert({ league: LEAGUE, data: state });
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
