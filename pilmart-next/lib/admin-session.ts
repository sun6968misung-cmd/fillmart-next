import { NextRequest } from 'next/server'
import type { AdminRole } from '@/types'

export interface AdminSession {
  username: string
  role: AdminRole
}

const COOKIE_NAME = 'admin_session'

async function getHmacKey(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!)
  return crypto.subtle.importKey(
    'raw', raw,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function signSession(payload: AdminSession): Promise<string> {
  const key = await getHmacKey()
  const data = JSON.stringify(payload)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigHex = Buffer.from(sig).toString('hex')
  return `${Buffer.from(data).toString('base64url')}.${sigHex}`
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const b64 = token.slice(0, dot)
    const sigHex = token.slice(dot + 1)
    const data = Buffer.from(b64, 'base64url').toString('utf-8')
    const key = await getHmacKey()
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      Buffer.from(sigHex, 'hex'),
      new TextEncoder().encode(data)
    )
    if (!valid) return null
    return JSON.parse(data) as AdminSession
  } catch {
    return null
  }
}

export async function getAdminSession(req: NextRequest): Promise<AdminSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export async function requireAdmin(req: NextRequest): Promise<AdminSession | Response> {
  const session = await getAdminSession(req)
  if (!session) return new Response('Unauthorized', { status: 401 })
  return session
}

export async function requireSuper(req: NextRequest): Promise<AdminSession | Response> {
  const session = await getAdminSession(req)
  if (!session) return new Response('Unauthorized', { status: 401 })
  if (session.role !== 'super') return new Response('Forbidden', { status: 403 })
  return session
}

export function sessionCookieOptions(maxAge = 86400) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
    secure: process.env.NODE_ENV === 'production',
  }
}
