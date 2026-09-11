import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

async function authedClient() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await authedClient()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product_ids: data.map(r => r.product_id) })
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await authedClient()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { product_id } = await req.json() as { product_id?: string }
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const { error } = await supabase
    .from('wishlists')
    .insert({ user_id: user.id, product_id })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ ok: true }) // 이미 존재 — 멱등
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await authedClient()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { product_id } = await req.json() as { product_id?: string }
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', product_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
