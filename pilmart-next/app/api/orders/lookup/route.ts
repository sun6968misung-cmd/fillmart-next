import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

// 단순 인메모리 레이트 리미터 — IP 당 5분에 10회
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 5 * 60 * 1000
const MAX_REQ = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_REQ
}

// 배송지 마스킹: "(12345) 서울특별시 서초구 ***"
function maskAddress(addr: string): string {
  if (!addr) return ''
  const parts = addr.split(' ')
  if (parts.length <= 3) return addr
  return parts.slice(0, 3).join(' ') + ' ***'
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isRateLimited(ip))
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })

  const body = await req.json() as { order_key?: string; phone_last4?: string }
  const { order_key, phone_last4 } = body

  if (!order_key || !phone_last4 || !/^\d{4}$/.test(phone_last4))
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  const service = createServiceClient()
  const { data: order } = await service
    .from('orders')
    .select('order_key, status, items, total_amount, payment_method, delivery_address, delivery_memo, customer_name, customer_phone, created_at, cancelled_items')
    .eq('order_key', order_key)
    .neq('status', '삭제됨')
    .single()

  // 주문 없거나 전화번호 끝 4자리 불일치 → 같은 404 반환 (정보 노출 방지)
  if (!order || !String(order.customer_phone ?? '').endsWith(phone_last4))
    return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({
    order_key:        order.order_key,
    status:           order.status,
    items:            order.items,
    total_amount:     order.total_amount,
    payment_method:   order.payment_method,
    delivery_address: maskAddress(order.delivery_address ?? ''),
    delivery_memo:    order.delivery_memo ?? '',
    customer_name:    order.customer_name ?? '',
    cancelled_items:  order.cancelled_items ?? [],
    created_at:       order.created_at,
  })
}
