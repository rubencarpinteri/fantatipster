// app/api/auth/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // usa env lato server

export async function GET() {
  const has = !!process.env.ADMIN_PASSWORD;
  return NextResponse.json({ hasAdminPassword: has });
}

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;

    if (!password) {
      return NextResponse.json({ error: "Missing password" }, { status: 400 });
    }
    if (!expected) {
      return NextResponse.json({ error: "ADMIN_PASSWORD not set" }, { status: 500 });
    }
    if (password !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
