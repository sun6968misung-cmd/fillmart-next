import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    order_key, items, total_amount, vat_amount, payment_method,
    delivery_address, delivery_memo, customer_name, customer_phone,
  } = body

  if (!order_key)
    return NextResponse.json({ error: 'order_key required' }, { status: 400 })
  if (!items?.length)
    return NextResponse.json({ error: 'items must not be empty' }, { status: 400 })
  if (!total_amount || total_amount <= 0)
    return NextResponse.json({ error: 'invalid total_amount' }, { status: 400 })

  // user_id 추출 — 세션 없으면 null (비회원 허용)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const user_id = user?.id ?? null

  const service = createServiceClient()
  const { data, error } = await service
    .from('orders')
    .insert({
      order_key,
      user_id,
      items,
      total_amount,
      vat_amount: vat_amount ?? 0,
      payment_method,
      delivery_address: delivery_address ?? '',
      delivery_memo: delivery_memo ?? '',
      customer_name,
      customer_phone,
      status: '결제대기',
      pending_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (!error) return NextResponse.json({ order_id: data.id }, { status: 201 })

  // order_key UNIQUE 위반 — 기존 행 조회 후 멱등 반환
  if (error.code === '23505') {
    const { data: existing } = await service
      .from('orders')
      .select('id')
      .eq('order_key', order_key)
      .single()
    return NextResponse.json({ order_id: existing?.id }, { status: 200 })
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}
