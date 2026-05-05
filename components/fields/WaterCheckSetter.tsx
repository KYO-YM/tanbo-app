'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Droplets, Check, X } from 'lucide-react'

interface Props {
  fieldId: string
  nextWaterCheck: string | null
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function badgeClass(days: number | null): string {
  if (days === null) return 'bg-gray-100 text-gray-500'
  if (days < 0) return 'bg-red-100 text-red-600'
  if (days <= 2) return 'bg-orange-100 text-orange-600'
  return 'bg-blue-50 text-blue-600'
}

function badgeLabel(days: number | null, dateStr: string | null): string {
  if (days === null || !dateStr) return '未設定'
  if (days < 0) return `${Math.abs(days)}日超過`
  if (days === 0) return '今日'
  return `${days}日後`
}

export function WaterCheckBadge({ nextWaterCheck }: { nextWaterCheck: string | null }) {
  const days = daysUntil(nextWaterCheck)
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass(days)}`}>
      <Droplets size={10} />
      {badgeLabel(days, nextWaterCheck)}
    </span>
  )
}

export default function WaterCheckSetter({ fieldId, nextWaterCheck }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(nextWaterCheck ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const days = daysUntil(nextWaterCheck)

  async function handleSave() {
    setLoading(true)
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fieldId, next_water_check: value || null }),
    })
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="date"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          autoFocus
        />
        <button onClick={handleSave} disabled={loading} className="text-green-600 hover:text-green-700 p-0.5 disabled:opacity-40">
          <Check size={14} />
        </button>
        <button onClick={() => { setValue(nextWaterCheck ?? ''); setEditing(false) }} className="text-gray-400 hover:text-gray-600 p-0.5">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80 ${badgeClass(days)}`}
      title="次回水管理日を設定"
    >
      <Droplets size={10} />
      {badgeLabel(days, nextWaterCheck)}
    </button>
  )
}
