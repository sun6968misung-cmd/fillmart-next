import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-session'
import { createServiceClient } from '@/lib/supabase-server'
import { getFcmMessaging } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('push_schedules')
    .select('id, title, body, url, scheduled_at, status, created_at')
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const { id } = await req.json() as { id: string }
  const supabase = createServiceClient()
  await supabase.from('push_schedules').update({ status: 'cancelled' }).eq('id', id)

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const { title, body, url, userId, scheduledAt } = await req.json() as {
    title: string
    body: string
    url?: string
    userId?: string
    scheduledAt?: string
  }

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'title과 body가 필요합니다' }, { status: 400 })
  }

  // 예약 발송
  if (scheduledAt) {
    const supabase = createServiceClient()
    const { error } = await supabase.from('push_schedules').insert({
      title: title.trim(),
      body: body.trim(),
      url: url?.trim() || null,
      scheduled_at: scheduledAt,
      status: 'pending',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ scheduled: true })
  }

  // 즉시 발송
  const supabase = createServiceClient()
  let tokens: string[] = []

  if (userId) {
    const { data } = await supabase.from('profiles').select('fcm_token').eq('id', userId).single()
    if (data?.fcm_token) tokens = [data.fcm_token]
  } else {
    const { data } = await supabase.from('profiles').select('fcm_token').not('fcm_token', 'is', null)
    tokens = (data ?? []).map((r: { fcm_token: string }) => r.fcm_token).filter(Boolean)
  }

  if (tokens.length === 0) {
    return NextResponse.json({ sent: 0, total: 0, message: '전송 가능한 대상이 없습니다 (FCM 토큰 미등록)' })
  }

  try {
    const messaging = getFcmMessaging()
    const data: Record<string, string> = {}
    if (url?.trim()) data.url = url.trim()

    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: { channelId: 'pilmart_default', sound: 'default' },
      },
    })

    const successCount = result.responses.filter(r => r.success).length
    const failCount = result.responses.filter(r => !r.success).length

    return NextResponse.json({ sent: successCount, total: tokens.length, failed: failCount })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Push] FCM 전송 오류:', msg)
    return NextResponse.json({ sent: 0, total: tokens.length, failed: tokens.length, message: `FCM 오류: ${msg}` }, { status: 500 })
  }
}
