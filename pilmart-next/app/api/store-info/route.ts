import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-session'
import { createServiceClient } from '@/lib/supabase-server'

const DEFAULTS: Record<string, string> = {
  name: '필식자재마마트 다사점',
  phone: '053-593-8253',
  address: '대구광역시 달성군 다사읍 달구벌대로 858',
}

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('store_info').select('*')
  const info: Record<string, string> = { ...DEFAULTS }
  if (data) {
    for (const row of data) info[row.key] = row.value
  }
  return NextResponse.json(info)
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const body = await req.json()
  const supabase = createServiceClient()
  const rows = Object.entries(body).map(([key, value]) => ({ key, value: String(value) }))
  const { error } = await supabase.from('store_info').upsert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
