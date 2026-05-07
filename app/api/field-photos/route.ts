import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fieldId = searchParams.get('field_id')
  if (!fieldId) return NextResponse.json({ error: 'field_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('field_photos')
    .select('*')
    .eq('field_id', fieldId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { field_id, url, caption } = await req.json()
  const { data, error } = await supabase
    .from('field_photos')
    .insert({ field_id, url, caption })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ストレージのファイルも削除
  const { data: photo } = await supabase.from('field_photos').select('url').eq('id', id).single()
  if (photo?.url) {
    const path = photo.url.split('/field-photos/')[1]
    if (path) await supabase.storage.from('field-photos').remove([path])
  }

  const { error } = await supabase.from('field_photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
