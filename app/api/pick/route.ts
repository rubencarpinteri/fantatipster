export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

const LEAGUE = process.env.LEAGUE_ID || "default";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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

    // 1) Carica stato corrente
    const { data: row, error } = await supabase
      .from("states")
      .select("data")
      .eq("league", LEAGUE)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "DB read error" }, { status: 500 });
    }

    const state: any =
      (row as any)?.data ?? row ?? {
        teams: [],
        settings: {},
        schedule: [],
        results: {},
        picks: {},
        updatedAt: new Date().toISOString(),
      };

    if (!state.picks) state.picks = {};

    // 2) DELETE (solo admin): elimina una schedina intera di una week o solo un match
    if (body.delete) {
      const email = String(body.email || "").trim();
      const week = Number(body.week);
      const matchNumber = body.matchNumber != null ? Number(body.matchNumber) : undefined;
      const adminPassword = String(body.adminPassword || "");

      if (!ADMIN_PASSWORD) {
        return NextResponse.json({ error: "ADMIN_PASSWORD not set" }, { status: 500 });
      }
      if (adminPassword !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!email || !week) {
        return NextResponse.json({ error: "Missing email/week for delete" }, { status: 400 });
      }

      if (!state.picks[email] || !state.picks[email].weeks || !state.picks[email].weeks[week]) {
        // niente da cancellare → ok idempotente
        return NextResponse.json({ ok: true });
      }

      if (typeof matchNumber === "number") {
        // cancella SOLO un match
        delete state.picks[email].weeks[week][matchNumber];
      } else {
        // cancella TUTTA la schedina della week (compreso timestamp)
        delete state.picks[email].weeks[week];
      }

      // se l'utente non ha più weeks, puoi opzionalmente rimuoverlo
      if (state.picks[email] && Object.keys(state.picks[email].weeks || {}).length === 0) {
        // commenta questa riga se vuoi mantenerlo comunque:
        // delete state.picks[email];
      }

      state.updatedAt = new Date().toISOString();
      const { error: upErr } = await supabase
        .from("states")
        .upsert({ league: LEAGUE, data: state })
        .eq("league", LEAGUE);

      if (upErr) return NextResponse.json({ error: "DB write error" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // 3) INVIO FINALE: salva timestamp _submittedAt
    if (body.submit) {
      const email = String(body.email || "").trim();
      const name = String(body.name || "").trim();
      const week = Number(body.week);
      const submittedAt = body.submittedAt || new Date().toISOString();

      if (!email || !week) {
        return NextResponse.json({ error: "Missing email/week for submit" }, { status: 400 });
      }

      if (!state.picks[email]) state.picks[email] = { name, weeks: {} };
      if (!state.picks[email].weeks) state.picks[email].weeks = {};
      if (!state.picks[email].weeks[week]) state.picks[email].weeks[week] = {};

      state.picks[email].weeks[week]._submittedAt = submittedAt;
    }

    // 4) PICK singolo
    const {
      email,
      name,
      week,
      matchNumber,
      pick,
    }: {
      email?: string;
      name?: string;
      week?: number;
      matchNumber?: number;
      pick?: "1" | "X" | "2";
    } = body || {};

    if (
      email &&
      name &&
      typeof week === "number" &&
      typeof matchNumber === "number" &&
      pick
    ) {
      if (!state.picks[email]) state.picks[email] = { name, weeks: {} };
      if (!state.picks[email].weeks) state.picks[email].weeks = {};
      if (!state.picks[email].weeks[week]) state.picks[email].weeks[week] = {};
      state.picks[email].weeks[week][matchNumber] = pick;
    }

    // Se non è né submit né pick valido → 400
    if
