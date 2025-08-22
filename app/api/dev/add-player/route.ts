// app/api/dev/add-player/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const LEAGUE_ID = process.env.LEAGUE_ID || 'default';

function client() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const password = url.searchParams.get('password') || '';
    const user = (url.searchParams.get('user') || '').toLowerCase();
    const pwd = url.searchParams.get('pwd') || '';
    const name = url.searchParams.get('name') || user;

    if (!ADMIN_PASSWORD) return NextResponse.json({ error: 'ADMIN_PASSWORD not set' }, { status: 500 });
    if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user || !pwd) return NextResponse.json({ error: 'Missing user/pwd' }, { status: 400 });

    const supabase = client();
    const { data: row, error } = await supabase
      .from('states')
      .select('data')
      .eq('league', LEAGUE_ID)
      .maybeSingle();
    if (error) throw error;

    const data = row?.data || {
      teams: [], settings: { players: {} }, schedule: [], results: {}, picks: {}, updatedAt: new Date().toISOString()
    };

    data.settings ||= {};
    data.settings.players ||= {};
    data.settings.players[user] = { password: pwd, name };
    data.updatedAt = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('states')
      .upsert({ league: LEAGUE_ID, data });
    if (upsertError) throw upsertError;

    return NextResponse.json({ ok: true, user, name });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
