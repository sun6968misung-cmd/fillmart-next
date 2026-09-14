import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

export const runtime = 'nodejs'

function getFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0]

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다')

  return initializeApp({ credential: cert(JSON.parse(raw)) })
}

export function getFcmMessaging() {
  getFirebaseAdmin()
  return getMessaging()
}
