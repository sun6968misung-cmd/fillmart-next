import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase-server'
import { signSession, sessionCookieOptions } from '@/lib/admin-session'
import type { AdminRole } from '@/types'

export const runtime = 'nodejs'

function sha256hex(str: string): string {
  return createHash('sha256').update(str).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { username?: string; password: string }
  const supabase = createServiceClient()

  const targetUsername =
    !body.username || body.username === 'admin' ? '__super__' : body.username

  const { data: account } = await supabase
    .from('admin_accounts')
    .select('id, username, password_hash, role, is_active')
    .eq('username', targetUsername)
    .single()

  if (!account || !account.is_active) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let valid = false
  const hash: string = account.password_hash

  if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
    // bcrypt
    valid = await bcrypt.compare(body.password, hash)
  } else if (hash === '__PENDING__') {
    // Bootstrap: DB에 아직 비밀번호 미설정 — 기본값 1234만 허용
    if (body.password === '1234') {
      valid = true
      const newHash = await bcrypt.hash(body.password, 12)
      await supabase
        .from('admin_accounts')
        .update({ password_hash: newHash })
        .eq('id', account.id)
    }
  } else if (/^[0-9a-f]{64}$/.test(hash)) {
    // SHA-256 레거시 — 검증 후 bcrypt로 재해시
    if (sha256hex(body.password) === hash) {
      valid = true
      const newHash = await bcrypt.hash(body.password, 12)
      await supabase
        .from('admin_accounts')
        .update({ password_hash: newHash })
        .eq('id', account.id)
    }
  }

  if (!valid) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const token = await signSession({
    username: account.username,
    role: account.role as AdminRole,
  })
  const res = NextResponse.json({
    ok: true,
    username: account.username,
    role: account.role,
  })
  res.cookies.set('admin_session', token, sessionCookieOptions())
  return res
}
