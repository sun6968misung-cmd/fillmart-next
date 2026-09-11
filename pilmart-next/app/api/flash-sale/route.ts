import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-session'
import { createServiceClient } from '@/lib/supabase-server'

const DEFAULT = { startHour: 9, endHour: 22, products: [] }

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('flash_sale')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return NextResponse.json(DEFAULT)
  return NextResponse.json({
    id: data.id,
    startHour: data.start_hour ?? DEFAULT.startHour,
    endHour: data.end_hour ?? DEFAULT.endHour,
    products: data.products ?? [],
  })
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const { id, startHour, endHour, products } = await req.json()
  const supabase = createServiceClient()
  if (id) {
    const { error } = await supabase
      .from('flash_sale')
      .update({ start_hour: startHour, end_hour: endHour, products })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } else {
    const { data, error } = await supabase
      .from('flash_sale')
      .insert({ start_hour: startHour, end_hour: endHour, products, is_active: true })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  }
}
