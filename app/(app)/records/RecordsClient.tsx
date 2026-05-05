'use client'
import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: '未着手',
  in_progress: '進行中',
  done: '完了',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
}

interface WorkRecord {
  id: string
  field_id: string
  work_type_id: string
  status: string
  work_date: string | null
  memo: string | null
  fields: { name: string } | null
  work_types: { name: string; color: string } | null
}

interface Props {
  records: WorkRecord[]
  fieldNames: string[]
  workTypeNames: string[]
}

export default function RecordsClient({ records, fieldNames, workTypeNames }: Props) {
  const [fieldFilter, setFieldFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => records.filter(r => {
    if (fieldFilter && r.fields?.name !== fieldFilter) return false
    if (typeFilter && r.work_types?.name !== typeFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  }), [records, fieldFilter, typeFilter, statusFilter])

  function handleCsvExport() {
    const header = ['田んぼ名', '作業種別', '状態', '実施日', 'メモ']
    const rows = filtered.map(r => [
      r.fields?.name ?? '',
      r.work_types?.name ?? '',
      STATUS_LABEL[r.status] ?? r.status,
      r.work_date ?? '',
      r.memo ?? '',
    ])
    const csv = [header, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `作業記録_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={fieldFilter}
          onChange={e => setFieldFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        >
          <option value="">すべての田んぼ</option>
          {fieldNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        >
          <option value="">すべての作業</option>
          {workTypeNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        >
          <option value="">すべての状態</option>
          <option value="pending">未着手</option>
          <option value="in_progress">進行中</option>
          <option value="done">完了</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} 件</span>
        <button
          onClick={handleCsvExport}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-700 border border-gray-300 hover:border-green-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Download size={13} />
          CSV出力
        </button>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">田んぼ名</th>
              <th className="text-left px-4 py-3">作業種別</th>
              <th className="text-left px-4 py-3">状態</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">実施日</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">メモ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{r.fields?.name ?? '-'}</td>
                <td className="px-4 py-3">
                  {r.work_types ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: r.work_types.color }}
                      />
                      {r.work_types.name}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? ''}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {r.work_date ?? '-'}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell max-w-xs truncate">
                  {r.memo ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            該当する作業記録がありません
          </div>
        )}
      </div>
    </div>
  )
}
