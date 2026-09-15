import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { getFcmMessaging } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

const METHOD_LABEL: Record<string, string> = {
  '카드': '카드결제', '계좌이체': '계좌이체',
  'meet-card': '만나서(카드)', 'meet-cash': '만나서(현금)',
}

// 주문 접수 시 활성 관리자 전체에게 푸시 발송. 실패해도 주문 생성 자체는 성공 처리한다.
async function notifyAdmins(orderKey: string, paymentMethod: string, totalAmount: number) {
  try {
    const service = createServiceClient()
    const { data, error } = await service
      .from('admin_accounts')
      .select('fcm_token')
      .eq('is_active', true)
      .not('fcm_token', 'is', null)

    if (error) {
      console.error('[admin-notify] admin_accounts 조회 실패:', error.message)
      return
    }

    const tokens = (data ?? []).map(r => r.fcm_token as string).filter(Boolean)
    if (tokens.length === 0) return

    await getFcmMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: '새 주문 접수',
        body: `${METHOD_LABEL[paymentMethod] ?? paymentMethod} · ${totalAmount.toLocaleString('ko-KR')}원`,
      },
      data: { orderKey },
      // 'pilmart_default' — 앱이 이미 생성해둔 채널(FcmService). 등록 안 된 채널을 쓰면
      // 백그라운드/종료 상태에서 알림이 조용히 드롭된다.
      android: { priority: 'high', notification: { channelId: 'pilmart_default', sound: 'default' } },
    })
  } catch (e) {
    console.error('[admin-notify] 발송 실패:', e instanceof Error ? e.message : e)
  }
}

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

  // user_id 추출 — 세션 우선, 없으면 body.user_id fallback (앱 클라이언트용)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const user_id = user?.id ?? (body.user_id as string | null) ?? null

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

  if (!error) {
    await notifyAdmins(order_key, payment_method, total_amount)
    return NextResponse.json({ order_id: data.id }, { status: 201 })
  }

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
