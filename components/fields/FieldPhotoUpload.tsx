'use client'
import { useState, useRef, useEffect } from 'react'
import { Camera, Trash2, X, ZoomIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Photo { id: string; url: string; caption: string | null; created_at: string }

export default function FieldPhotoUpload({ fieldId }: { fieldId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/field-photos?field_id=${fieldId}`)
      .then(r => r.json())
      .then(data => setPhotos(Array.isArray(data) ? data : []))
  }, [fieldId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${fieldId}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('field-photos')
      .upload(path, file, { upsert: false })

    if (upErr) { alert('アップロード失敗: ' + upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('field-photos').getPublicUrl(path)

    const res = await fetch('/api/field-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_id: fieldId, url: publicUrl, caption: null }),
    })
    if (res.ok) {
      const saved: Photo = await res.json()
      setPhotos(prev => [saved, ...prev])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (!confirm('この写真を削除しますか？')) return
    await fetch(`/api/field-photos?id=${id}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-3">
      {/* アップロードボタン */}
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl text-sm text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50 w-full justify-center"
        >
          <Camera size={16} />
          {uploading ? 'アップロード中...' : '写真を追加'}
        </button>
      </div>

      {/* 写真グリッド */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative aspect-square group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt="田んぼ写真"
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => setPreview(p.url)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => setPreview(p.url)} className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:text-green-600">
                  <ZoomIn size={13} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* プレビューモーダル */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full">
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="プレビュー" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
