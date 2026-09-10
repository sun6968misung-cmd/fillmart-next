import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-session'
import type { AdminSession } from '@/lib/admin-session'
import type { Product, ProductOverride } from '@/types'

export const runtime = 'nodejs'

// Supabase row → ProductOverride (snake_case → camelCase)
function rowToOverride(row: Record<string, unknown>): ProductOverride {
  return {
    name: row.name as string | undefined,
    price: row.price as number | undefined,
    originalPrice: row.original_price as number | undefined,
    imageUrl: row.image_url as string | undefined,
    detailImageUrl: row.detail_image_url as string | undefined,
    category: row.category as string | undefined,
    desc: row.description as string | undefined,
    unit: row.unit as string | undefined,
    origin: row.origin as string | undefined,
    storage: row.storage as string | undefined,
    expiryDate: row.expiry_date as string | undefined,
    productInfo: row.product_info as string | undefined,
    customerServiceNo: row.customer_service_no as string | undefined,
    hidden: row.hidden as boolean | undefined,
    taxType: row.tax_type as ProductOverride['taxType'],
  }
}

// Supabase row → Product (custom_products)
function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    emoji: (row.emoji as string) ?? '📦',
    price: row.price as number,
    originalPrice: (row.original_price as number) ?? 0,
    section: (row.section as string) ?? 'fresh',
    origin: (row.origin as string) ?? '',
    category: (row.category as string) ?? '기타',
    storage: (row.storage as string) ?? '',
    unit: (row.unit as string) ?? '',
    desc: (row.description as string) ?? '',
    imageUrl: row.image_url as string | undefined,
    detailImageUrl: row.detail_image_url as string | undefined,
    expiryDate: row.expiry_date as string | undefined,
    productInfo: row.product_info as string | undefined,
    customerServiceNo: row.customer_service_no as string | undefined,
    hidden: (row.hidden as boolean) ?? false,
    taxType: (row.tax_type as Product['taxType']) ?? 'taxFree',
    maxQty: row.max_qty as number | undefined,
  }
}

// ProductOverride → Supabase columns (camelCase → snake_case)
function overrideToRow(productId: string, override: Partial<ProductOverride>) {
  return {
    product_id: productId,
    name: override.name,
    price: override.price,
    original_price: override.originalPrice,
    image_url: override.imageUrl,
    detail_image_url: override.detailImageUrl,
    category: override.category,
    description: override.desc,
    unit: override.unit,
    origin: override.origin,
    storage: override.storage,
    expiry_date: override.expiryDate,
    product_info: override.productInfo,
    customer_service_no: override.customerServiceNo,
    hidden: override.hidden,
    tax_type: override.taxType,
  }
}

export async function GET() {
  const supabase = createServiceClient()
  const [{ data: ovRows }, { data: custRows }] = await Promise.all([
    supabase.from('product_overrides').select('*'),
    supabase.from('custom_products').select('*').eq('hidden', false),
  ])

  const overrides: Record<string, ProductOverride> = {}
  for (const row of ovRows ?? []) {
    overrides[(row as Record<string, unknown>).product_id as string] =
      rowToOverride(row as Record<string, unknown>)
  }

  const customs: Product[] = (custRows ?? []).map(r =>
    rowToProduct(r as Record<string, unknown>)
  )

  return NextResponse.json({ overrides, customs })
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const supabase = createServiceClient()
  const body = await req.json() as Product
  const { error } = await supabase.from('custom_products').insert({
    id: body.id,
    name: body.name,
    emoji: body.emoji,
    price: body.price,
    original_price: body.originalPrice,
    section: body.section,
    origin: body.origin,
    category: body.category,
    storage: body.storage,
    unit: body.unit,
    description: body.desc,
    image_url: body.imageUrl,
    detail_image_url: body.detailImageUrl,
    expiry_date: body.expiryDate,
    product_info: body.productInfo,
    customer_service_no: body.customerServiceNo,
    tax_type: body.taxType ?? 'taxFree',
    hidden: false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const supabase = createServiceClient()
  const body = await req.json() as { productId: string; override: Partial<ProductOverride> }
  const { error } = await supabase
    .from('product_overrides')
    .upsert(overrideToRow(body.productId, body.override), { onConflict: 'product_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof Response) return authResult

  const supabase = createServiceClient()
  const body = await req.json() as { type: 'hide' | 'show' | 'remove'; productId: string }

  if (body.type === 'hide') {
    await supabase
      .from('product_overrides')
      .upsert({ product_id: body.productId, hidden: true }, { onConflict: 'product_id' })
  } else if (body.type === 'show') {
    await supabase
      .from('product_overrides')
      .update({ hidden: false })
      .eq('product_id', body.productId)
  } else if (body.type === 'remove') {
    await supabase.from('custom_products').delete().eq('id', body.productId)
    await supabase.from('product_overrides').delete().eq('product_id', body.productId)
  }

  return NextResponse.json({ ok: true })
}
