import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase-server'
import { requireSuper } from '@/lib/admin-session'
import type { ProductOverride, Product, AdminAccount } from '@/types'

export const runtime = 'nodejs'

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
    let pwHash = acct.passwordHash
    if (/^\$2[ab]\$/.test(pwHash)) {
      // already bcrypt — keep as-is
    } else if (/^[0-9a-f]{64}$/.test(pwHash)) {
      // SHA-256 hex — keep as-is, login route rehashes on next login
    } else {
      // plaintext — bcrypt now
      pwHash = await bcrypt.hash(pwHash, 12)
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
    let pwHash: string
    if (/^\$2[ab]\$/.test(body.superPw)) {
      pwHash = body.superPw
    } else if (/^[0-9a-f]{64}$/.test(body.superPw)) {
      pwHash = body.superPw  // SHA-256 — login route rehashes on next login
    } else {
      pwHash = await bcrypt.hash(body.superPw, 12)  // plaintext
    }
    await supabase
      .from('admin_accounts')
      .update({ password_hash: pwHash })
      .eq('username', '__super__')
  }

  return NextResponse.json({ ok: true })
}
