import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

const supabase = createClient(url, service, { auth: { persistSession: false } });

// Schema: CREATE TABLE states (league text primary key, data jsonb, updated_at timestamptz default now());
const LEAGUE = process.env.LEAGUE_ID || "default";

export async function GET() {
  try {
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

    // data può essere in data.data (Supabase) o già plain
    return NextResponse.json((data as any).data ?? data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Admin save: sovrascrive l'intero stato (squadre, calendario, risultati, ecc.)
export async function POST(req: Request) {
  try {
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
