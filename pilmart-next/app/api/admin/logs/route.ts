import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireAdmin, AdminSession } from '@/lib/admin-session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, actor, action, target, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const session = authResult as AdminSession
  const body = await req.json() as { action: string; target: string; detail?: string }

  const supabase = createServiceClient()
  const { error } = await supabase.from('audit_logs').insert({
    actor: session.username,   // 클라이언트 body의 actor 무시 — 세션에서 추출
    action: body.action,
    target: body.target,
    detail: body.detail ?? '',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE 엔드포인트 없음 — 의도적으로 구현하지 않음
