import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-session'
import { createServiceClient } from '@/lib/supabase-server'
import { getFcmMessaging } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const { title, body, userId } = await req.json() as {
    title: string
    body: string
    userId?: string
  }

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'title과 body가 필요합니다' }, { status: 400 })
  }

  const supabase = createServiceClient()
  let tokens: string[] = []

  if (userId) {
    const { data } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single()
    if (data?.fcm_token) tokens = [data.fcm_token]
  } else {
    const { data } = await supabase
      .from('profiles')
      .select('fcm_token')
      .not('fcm_token', 'is', null)
    tokens = (data ?? []).map((r: { fcm_token: string }) => r.fcm_token).filter(Boolean)
  }

  if (tokens.length === 0) {
    return NextResponse.json({ sent: 0, total: 0, message: '전송 가능한 대상이 없습니다 (FCM 토큰 미등록)' })
  }

  const messaging = getFcmMessaging()
  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    android: {
      priority: 'high',
      notification: { channelId: 'pilmart_default', sound: 'default' },
    },
  })

  const successCount = result.responses.filter(r => r.success).length
  const failCount = result.responses.filter(r => !r.success).length

  return NextResponse.json({ sent: successCount, total: tokens.length, failed: failCount })
}
