import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const KEY = "nosotros:items";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ items: null, configured: false });
  }
  const items = await redis.get(KEY);
  return NextResponse.json({ items: items ?? [], configured: true });
}

export async function POST(req: NextRequest) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ ok: false, configured: false }, { status: 200 });
  }
  const body = await req.json();
  await redis.set(KEY, body.items ?? []);
  return NextResponse.json({ ok: true, configured: true });
}
