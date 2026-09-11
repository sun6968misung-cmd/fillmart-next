import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, password, name, address, userType, businessNo, businessName, businessType, businessCategory } = body

    if (!phone || !password || !name) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const email = `${phone.replace(/-/g, '')}@pilmart.com`

    // 관리자 SDK로 생성 → 이메일 발송 없음, 즉시 활성화
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, provider: 'local' },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return NextResponse.json({ error: '이미 등록된 전화번호입니다.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // profiles 테이블에 상세 정보 저장
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        phone,
        name,
        address: address ?? '',
        user_type: userType ?? 'personal',
        provider: 'local',
        ...(userType === 'business' ? {
          business_no: businessNo,
          business_name: businessName,
          business_type: businessType,
          business_category: businessCategory,
        } : {}),
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
