import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'LINE not configured' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 水管理チェックが必要な田んぼを取得（今日以前）
  const today = new Date().toISOString().slice(0, 10)
  const { data: fields } = await supabase
    .from('fields')
    .select('name, next_water_check')
    .lte('next_water_check', today)
    .not('next_water_check', 'is', null)

  if (!fields || fields.length === 0) {
    return NextResponse.json({ sent: 0, message: '対象の田んぼなし' })
  }

  // LINE連携済みユーザー全員に通知
  const { data: profiles } = await supabase
    .from('profiles')
    .select('line_user_id')
    .not('line_user_id', 'is', null)

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'LINE連携ユーザーなし' })
  }

  const fieldList = fields.map(f => `・${f.name}（${f.next_water_check}）`).join('\n')
  const message = `🌾 水管理チェックのお知らせ\n\n以下の田んぼの水管理を確認してください：\n${fieldList}`

  let sent = 0
  for (const profile of profiles) {
    if (!profile.line_user_id) continue
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: profile.line_user_id, messages: [{ type: 'text', text: message }] }),
    })
    if (res.ok) sent++
  }

  return NextResponse.json({ sent, fields: fields.length })
}
