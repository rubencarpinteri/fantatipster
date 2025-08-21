import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

const LEAGUE = process.env.LEAGUE_ID || "default";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("states")
      .select("data")
      .eq("league", LEAGUE)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const seed = {
        teams: Array.from({ length: 10 }, (_, i) => `Team ${i + 1}`),
        settings: { numTeams: 10, weeks: 38, matchesPerWeek: 5, pointsCorrect: 1, bonusPerfectWeek: 2, allowDraw: true },
        schedule: [],
        results: {},
        picks: {},
        updatedAt: new Date().toISOString(),
      };
      const { error: insErr } = await supabase.from("states").insert({ league: LEAGUE, data: seed });
      if (insErr) throw insErr;
      return NextResponse.json(seed);
    }

    const payload = (data as any).data ?? data;
    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
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
    const { password, data } = body as { password?: string; data?: any };

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    data.updatedAt = new Date().toISOString();

    const { error } = await supabase.from("states").upsert({ league: LEAGUE, data });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
