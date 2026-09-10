import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase-server'
import { requireSuper, AdminSession } from '@/lib/admin-session'
import type { AdminRole } from '@/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const authResult = await requireSuper(req)
  if (authResult instanceof Response) return authResult

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('admin_accounts')
    .select('id, username, role, is_active, created_at')
    .neq('username', '__super__')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const authResult = await requireSuper(req)
  if (authResult instanceof Response) return authResult

  const body = await req.json() as { username: string; password: string; role: AdminRole }
  if (!body.username || body.username === 'admin' || body.username === '__super__') {
    return NextResponse.json({ error: '사용할 수 없는 아이디입니다' }, { status: 400 })
  }
  if (body.password.length < 4) {
    return NextResponse.json({ error: '비밀번호는 4자 이상' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const passwordHash = await bcrypt.hash(body.password, 12)
  const { error } = await supabase.from('admin_accounts').insert({
    username: body.username,
    password_hash: passwordHash,
    role: body.role,
    is_active: true,
  })

  if (error?.code === '23505') {
    return NextResponse.json({ error: '이미 존재하는 아이디입니다' }, { status: 409 })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireSuper(req)
  if (authResult instanceof Response) return authResult

  const session = authResult as AdminSession
  const body = await req.json() as { id?: string; isActive?: boolean; newPassword?: string; selfPw?: boolean }
  const supabase = createServiceClient()

  // selfPw: true → 세션 본인 비밀번호 변경 (session.username 사용)
  if (body.selfPw) {
    if (!body.newPassword || body.newPassword.length < 4) {
      return NextResponse.json({ error: '비밀번호는 4자 이상' }, { status: 400 })
    }
    const newHash = await bcrypt.hash(body.newPassword, 12)
    await supabase
      .from('admin_accounts')
      .update({ password_hash: newHash })
      .eq('username', session.username)
    return NextResponse.json({ ok: true })
  }

  if (body.newPassword !== undefined) {
    if (body.newPassword.length < 4) {
      return NextResponse.json({ error: '비밀번호는 4자 이상' }, { status: 400 })
    }
    const newHash = await bcrypt.hash(body.newPassword, 12)
    await supabase
      .from('admin_accounts')
      .update({ password_hash: newHash })
      .eq('id', body.id)
  } else if (body.isActive !== undefined) {
    await supabase
      .from('admin_accounts')
      .update({ is_active: body.isActive })
      .eq('id', body.id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireSuper(req)
  if (authResult instanceof Response) return authResult

  const body = await req.json() as { id: string }
  const supabase = createServiceClient()

  // __super__ 삭제 금지
  const { data } = await supabase
    .from('admin_accounts')
    .select('username')
    .eq('id', body.id)
    .single()
  if (data?.username === '__super__') {
    return NextResponse.json({ error: '최고관리자 계정은 삭제할 수 없습니다' }, { status: 403 })
  }

  await supabase.from('admin_accounts').delete().eq('id', body.id)
  return NextResponse.json({ ok: true })
}
