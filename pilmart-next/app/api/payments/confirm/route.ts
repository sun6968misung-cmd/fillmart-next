import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

// Toss "이미 처리된 결제" 에러코드 — 공식 문서 기준.
// 실제 샌드박스 이중호출 응답에서 다른 코드가 나오면 여기에 추가할 것.
const ALREADY_PAID_CODES = ['ALREADY_PROCESSED_PAYMENT']

const MEET_METHODS = ['meet-card', 'meet-cash']

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { paymentKey, orderId, amount } = body as {
    paymentKey: string | null
    orderId: string
    amount: number
  }

  if (!orderId)
    return NextResponse.json({ error: 'orderId required' }, { status: 400 })
  if (!amount || amount <= 0)
    return NextResponse.json({ error: 'invalid amount' }, { status: 400 })

  const service = createServiceClient()

  // 1. 주문 행 조회
  const { data: order } = await service
    .from('orders')
    .select('id, order_key, status, total_amount, payment_key, payment_method')
    .eq('id', orderId)
    .single()

  if (!order)
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 })

  if (order.status === '취소완료')
    return NextResponse.json({ error: 'order_cancelled' }, { status: 400 })

  // 2. 이미 confirm 완료된 경우 — 멱등 응답
  if (order.status === '주문완료' && order.payment_key && order.payment_key !== '__confirming__') {
    return NextResponse.json({
      order_id:     orderId,
      order_key:    order.order_key,
      status:       '주문완료',
      total_amount: order.total_amount,
    })
  }

  // 3. 금액 대조
  if (order.total_amount !== amount) {
    await service
      .from('orders')
      .update({ status: '취소완료' })
      .eq('id', orderId)
    return NextResponse.json(
      { error: 'amount_mismatch', db_amount: order.total_amount, toss_amount: amount },
      { status: 400 },
    )
  }

  // 4. 행 선점 — payment_key IS NULL 인 경우만 '__confirming__' 으로 업데이트
  const { data: claimed } = await service
    .from('orders')
    .update({ payment_key: '__confirming__' })
    .eq('id', orderId)
    .is('payment_key', null)
    .select('id, order_key, total_amount')

  // 5. 선점 실패 분기
  if (!claimed || claimed.length === 0) {
    const { data: current } = await service
      .from('orders')
      .select('payment_key, order_key, total_amount, status')
      .eq('id', orderId)
      .single()

    if (current?.payment_key === '__confirming__')
      return NextResponse.json({ error: 'confirm_in_progress' }, { status: 409 })

    // 실제 키 기록됨 → 이미 confirm 완료, 멱등 응답
    return NextResponse.json({
      order_id:     orderId,
      order_key:    current?.order_key,
      status:       '주문완료',
      total_amount: current?.total_amount,
    })
  }

  // 6. 만나서 결제 — Toss API 호출 없음
  if (MEET_METHODS.includes(order.payment_method)) {
    await service
      .from('orders')
      .update({ payment_key: order.payment_method, status: '주문완료', pending_expires_at: null })
      .eq('id', orderId)
    return NextResponse.json({
      order_id:     orderId,
      order_key:    claimed[0].order_key,
      status:       '주문완료',
      total_amount: amount,
    })
  }

  // 7. Toss confirm API 호출
  let tossRes: Response
  try {
    tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    // 타임아웃 등 네트워크 오류 — 선점 해제
    await service.from('orders').update({ payment_key: null }).eq('id', orderId)
    return NextResponse.json({ error: 'toss_network_error' }, { status: 500 })
  }

  // 8. Toss 응답 분기
  if (!tossRes.ok) {
    const tossBody = await tossRes.json()
    // 실제 Toss 에러 응답 확인용 — 운영 전 제거
    console.error('[toss-confirm-error]', JSON.stringify(tossBody))

    if (ALREADY_PAID_CODES.includes(tossBody.code)) {
      // Toss 이미 처리 완료 → 9번으로 낙하
    } else {
      // 진짜 실패 — 선점 해제 + 취소 처리
      await service
        .from('orders')
        .update({ payment_key: null, status: '취소완료' })
        .eq('id', orderId)
      return NextResponse.json(
        { error: 'toss_confirm_failed', toss_error: tossBody },
        { status: 500 },
      )
    }
  }

  // 9. confirm 성공 — '결제대기' → '주문완료'
  await service
    .from('orders')
    .update({ payment_key: paymentKey, status: '주문완료', pending_expires_at: null })
    .eq('id', orderId)

  return NextResponse.json({
    order_id:     orderId,
    order_key:    claimed[0].order_key,
    status:       '주문완료',
    total_amount: amount,
  })
}
