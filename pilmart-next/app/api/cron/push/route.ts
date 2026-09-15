import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { getFcmMessaging } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 발송 기한이 지난 pending 예약 조회
  const { data: dues } = await supabase
    .from('push_schedules')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())

  if (!dues || dues.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  // FCM 토큰 전체 조회
  const { data: profiles } = await supabase
    .from('profiles')
    .select('fcm_token')
    .not('fcm_token', 'is', null)
  const tokens: string[] = (profiles ?? []).map((r: { fcm_token: string }) => r.fcm_token).filter(Boolean)

  const messaging = getFcmMessaging()
  let processed = 0

  for (const schedule of dues) {
    try {
      let sentCount = 0
      if (tokens.length > 0) {
        const data: Record<string, string> = {}
        if (schedule.url) data.url = schedule.url

        const result = await messaging.sendEachForMulticast({
          tokens,
          notification: { title: schedule.title, body: schedule.body },
          data,
          android: {
            priority: 'high',
            notification: { channelId: 'pilmart_default', sound: 'default' },
          },
        })
        sentCount = result.responses.filter(r => r.success).length
      }

      await supabase
        .from('push_schedules')
        .update({ status: 'sent', sent_count: sentCount })
        .eq('id', schedule.id)

      processed++
    } catch (e) {
      console.error('[Cron Push] 오류:', schedule.id, e)
    }
  }

  return NextResponse.json({ processed, total: dues.length })
}
