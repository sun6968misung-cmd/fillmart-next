import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase-server'
import { requireSuper } from '@/lib/admin-session'
import type { ProductOverride, Product, AdminAccount } from '@/types'

export const runtime = 'nodejs'

function sha256hex(str: string): string {
  return createHash('sha256').update(str).digest('hex')
}

export async function POST(req: NextRequest) {
  const authResult = await requireSuper(req)
  if (authResult instanceof Response) return authResult

  const body = await req.json() as {
    products: Record<string, ProductOverride>
    customProducts: Product[]
    adminAccounts: AdminAccount[]
    superPw: string
  }

  const supabase = createServiceClient()

  // 1. product_overrides UPSERT
  if (Object.keys(body.products ?? {}).length > 0) {
    const rows = Object.entries(body.products).map(([id, ov]) => ({
      product_id: id,
      name: ov.name,
      price: ov.price,
      original_price: ov.originalPrice,
      image_url: ov.imageUrl,
      detail_image_url: ov.detailImageUrl,
      category: ov.category,
      description: ov.desc,
      unit: ov.unit,
      origin: ov.origin,
      storage: ov.storage,
      expiry_date: ov.expiryDate,
      product_info: ov.productInfo,
      customer_service_no: ov.customerServiceNo,
      hidden: ov.hidden ?? false,
      tax_type: ov.taxType ?? 'taxFree',
    }))
    await supabase.from('product_overrides').upsert(rows, { onConflict: 'product_id' })
  }

  // 2. custom_products INSERT (중복은 upsert)
  if ((body.customProducts ?? []).length > 0) {
    const rows = body.customProducts.map(p => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      price: p.price,
      original_price: p.originalPrice,
      section: p.section,
      origin: p.origin,
      category: p.category,
      storage: p.storage,
      unit: p.unit,
      description: p.desc,
      image_url: p.imageUrl,
      detail_image_url: p.detailImageUrl,
      expiry_date: p.expiryDate,
      product_info: p.productInfo,
      customer_service_no: p.customerServiceNo,
      tax_type: p.taxType ?? 'taxFree',
      hidden: p.hidden ?? false,
    }))
    await supabase
      .from('custom_products')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })
  }

  // 3. admin_accounts UPSERT (bcrypt 해시)
  for (const acct of body.adminAccounts ?? []) {
    // 기존 해시가 SHA-256이면 bcrypt로 재해시
    let pwHash = acct.passwordHash
    if (!/^\$2[ab]\$/.test(pwHash)) {
      // SHA-256 hex or plaintext — bcrypt hash
      pwHash = await bcrypt.hash(pwHash.length === 64 ? pwHash : acct.passwordHash, 12)
    }
    await supabase.from('admin_accounts').upsert({
      username: acct.username,
      password_hash: pwHash,
      role: acct.role,
      is_active: acct.isActive,
    }, { onConflict: 'username' })
  }

  // 4. __super__ 비밀번호 설정 (superPw → bcrypt)
  if (body.superPw) {
    // superPw는 localStorage의 adminPw (SHA-256 해시 또는 평문)
    // 평문인 경우 (기본값 '1234' 등) bcrypt로 직접 해시
    const plainPw = body.superPw
    const newHash = await bcrypt.hash(plainPw, 12)
    await supabase
      .from('admin_accounts')
      .update({ password_hash: newHash })
      .eq('username', '__super__')
  }

  return NextResponse.json({ ok: true })
}
