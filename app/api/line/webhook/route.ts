import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET
  if (!channelSecret) return NextResponse.json({ ok: false }, { status: 500 })

  const body = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64')
  if (hash !== signature) return NextResponse.json({ error: 'invalid signature' }, { status: 401 })

  const events = JSON.parse(body).events ?? []
  const supabase = await createClient()

  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue

    const lineUserId: string = event.source.userId
    const text: string = event.message.text.trim()

    // 連携コードの検索（6文字英数字）
    if (/^[A-Z0-9]{6}$/i.test(text)) {
      const code = text.toUpperCase()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('line_link_code', code)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ line_user_id: lineUserId })
          .eq('id', profile.id)

        await pushMessage(lineUserId, '✅ LINE連携が完了しました！\n水管理アラートなどの通知をお送りします。')
      } else {
        await pushMessage(lineUserId, '⚠️ コードが見つかりません。アプリの設定画面でコードを確認してください。')
      }
    }
  }

  return NextResponse.json({ ok: true })
}

async function pushMessage(to: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
  })
}
