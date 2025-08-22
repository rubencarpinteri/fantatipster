import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET() {
  const out: any = {
    ok: true,
    env: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      LEAGUE_ID: process.env.LEAGUE_ID || 'default'
    },
    db: { connected: false, tableExists: false, rowCount: null, error: null }
  };

  try {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const client = createClient(url, key, { auth: { persistSession: false } });

    const { error, count } = await client
      .from('states')
      .select('league', { count: 'exact', head: true });

    if (error) throw error;

    out.db.connected = true;
    out.db.tableExists = true;
    out.db.rowCount = count ?? 0;
  } catch (e: any) {
    out.db.error = e?.message || String(e);
  }

  return NextResponse.json(out);
}
