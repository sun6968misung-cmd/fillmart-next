import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .neq('status', '삭제됨')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const { orderId, status, cancelledItems, totalAmount } = await req.json()
  const supabase = createServiceClient()
  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (cancelledItems !== undefined) updates.cancelled_items = cancelledItems
  if (totalAmount !== undefined) updates.total_amount = totalAmount
  const { error } = await supabase.from('orders').update(updates).eq('order_key', orderId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const { orderId, all } = await req.json()
  const supabase = createServiceClient()
  if (all) {
    // Soft delete: mark all orders as '삭제됨' status
    const { error } = await supabase
      .from('orders')
      .update({ status: '삭제됨' })
      .not('id', 'is', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('orders').delete().eq('order_key', orderId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
