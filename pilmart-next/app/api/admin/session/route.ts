import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ username: session.username, role: session.role })
}
