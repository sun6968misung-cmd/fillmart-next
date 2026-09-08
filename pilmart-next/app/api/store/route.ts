import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

const ALLOWED_KEYS = new Set([
  'pilmart_products',
  'pilmart_custom_products',
  'pilmart_notices',
  'pilmart_flash_sale',
  'pilmart_store_info',
  'pilmart_orders',
  'pilmart_admin_pw',
  'pilmart_users',
]);

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') ?? '';
  if (!ALLOWED_KEYS.has(key)) return NextResponse.json(null, { status: 400 });
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${key}.json`), 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') ?? '';
  if (!ALLOWED_KEYS.has(key)) return NextResponse.json({ error: 'invalid key' }, { status: 400 });
  try {
    const body = await req.json();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, `${key}.json`), JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'write failed' }, { status: 500 });
  }
}
