import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-session'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

// 관리자 앱/브라우저가 로그인 후 자신의 FCM 토큰을 등록한다.
// 주문 접수 알림(app/api/orders/pending)이 이 토큰으로 발송된다.
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const { token } = await req.json() as { token?: string }
  if (!token?.trim())
    return NextResponse.json({ error: 'token required' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service
    .from('admin_accounts')
    .update({ fcm_token: token.trim() })
    .eq('username', authResult.username)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
