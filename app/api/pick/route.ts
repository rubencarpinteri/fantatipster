import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

const LEAGUE = process.env.LEAGUE_ID || "default";

function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email, name, week, matchNumber, pick } = body as {
      email: string;
      name: string;
      week: number;
      matchNumber: number;
      pick: "1" | "X" | "2";
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
    if (!data) {
      return NextResponse.json({ error: "League not initialized" }, { status: 400 });
    }

    const state = (data as any).data ?? data;

    if (!state.picks[email]) state.picks[email] = { name, weeks: {} };
    if (!state.picks[email].weeks[week]) state.picks[email].weeks[week] = {};
    state.picks[email].weeks[week][matchNumber] = pick;
    state.updatedAt = new Date().toISOString();

    const { error: updErr } = await supabase.from("states").upsert({ league: LEAGUE, data: state });
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
