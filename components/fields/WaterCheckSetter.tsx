'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Droplets, X } from 'lucide-react'

interface Props {
  fieldId: string
  nextWaterCheck: string | null
}

const PRESETS = [
  { label: '1時間後', hours: 1 },
  { label: '3時間後', hours: 3 },
  { label: '6時間後', hours: 6 },
  { label: '12時間後', hours: 12 },
  { label: '24時間後', hours: 24 },
  { label: '48時間後', hours: 48 },
]

function hoursUntil(isoStr: string | null): number | null {
  if (!isoStr) return null
  return (new Date(isoStr).getTime() - Date.now()) / 3600000
}

function badgeStyle(hours: number | null): { cls: string; label: string } {
  if (hours === null) return { cls: 'bg-gray-100 text-gray-500', label: '未設定' }
  if (hours < 0) {
    const h = Math.abs(hours)
    return { cls: 'bg-red-100 text-red-600', label: h < 1 ? '超過' : `${Math.floor(h)}時間超過` }
  }
  if (hours < 2) return { cls: 'bg-orange-100 text-orange-600', label: `あと${Math.round(hours * 60)}分` }
  if (hours < 6) return { cls: 'bg-yellow-100 text-yellow-700', label: `あと${Math.round(hours)}時間` }
  return { cls: 'bg-blue-50 text-blue-600', label: `あと${Math.round(hours)}時間` }
}

export function WaterCheckBadge({ nextWaterCheck }: { nextWaterCheck: string | null }) {
  const hours = hoursUntil(nextWaterCheck)
  const { cls, label } = badgeStyle(hours)
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      <Droplets size={10} />
      {label}
    </span>
  )
}

export default function WaterCheckSetter({ fieldId, nextWaterCheck }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const hours = hoursUntil(nextWaterCheck)
  const { cls, label } = badgeStyle(hours)

  async function setCheck(h: number) {
    setLoading(true)
    const dt = new Date(Date.now() + h * 3600000).toISOString()
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fieldId, next_water_check: dt }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function clearCheck() {
    setLoading(true)
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fieldId, next_water_check: null }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80 disabled:opacity-50 ${cls}`}
        title="次回水管理チェック時刻を設定"
      >
        <Droplets size={10} />
        {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 bg-white rounded-xl shadow-lg border p-3 min-w-48">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">次回チェックまで</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {PRESETS.map(p => (
                <button
                  key={p.hours}
                  onClick={() => setCheck(p.hours)}
                  className="text-xs px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors text-center"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {nextWaterCheck && (
              <button
                onClick={clearCheck}
                className="w-full text-xs px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                クリア
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
