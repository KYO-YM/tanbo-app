import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: fields }, { data: records }, { data: workTypes }] = await Promise.all([
    supabase.from('fields').select('id, name'),
    supabase.from('work_records').select('field_id, work_type_id, status'),
    supabase.from('work_types').select('id, name, color').order('sort_order'),
  ])

  const totalFields = fields?.length ?? 0
  const totalRecords = records?.length ?? 0
  const doneRecords = records?.filter(r => r.status === 'done').length ?? 0
  const inProgressRecords = records?.filter(r => r.status === 'in_progress').length ?? 0
  const completionRate = totalRecords > 0 ? Math.round((doneRecords / totalRecords) * 100) : 0

  // 作業種別ごとの集計
  const byType = (workTypes ?? []).map(wt => {
    const wtRecords = (records ?? []).filter(r => r.work_type_id === wt.id)
    const total = wtRecords.length
    const done = wtRecords.filter(r => r.status === 'done').length
    const inProg = wtRecords.filter(r => r.status === 'in_progress').length
    return { ...wt, total, done, inProg, rate: total > 0 ? Math.round((done / total) * 100) : 0 }
  }).filter(wt => wt.total > 0)

  // 田んぼごとの集計
  const byField = (fields ?? []).map(f => {
    const fRecords = (records ?? []).filter(r => r.field_id === f.id)
    const total = fRecords.length
    const done = fRecords.filter(r => r.status === 'done').length
    return { ...f, total, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 }
  }).filter(f => f.total > 0).sort((a, b) => b.rate - a.rate)

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard size={22} className="text-green-700" />
        <h1 className="text-xl font-bold text-gray-800">ダッシュボード</h1>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="登録田んぼ数" value={`${totalFields} 枚`} color="green" />
        <StatCard label="全体完了率" value={`${completionRate}%`} color="blue" />
        <StatCard label="進行中" value={`${inProgressRecords} 件`} color="yellow" />
        <StatCard label="完了済み" value={`${doneRecords} 件`} color="emerald" />
      </div>

      {/* 全体進捗バー */}
      {totalRecords > 0 && (
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">全体進捗</h2>
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${completionRate}%` }}
            />
            <div
              className="bg-yellow-400 transition-all"
              style={{ width: `${totalRecords > 0 ? Math.round((inProgressRecords / totalRecords) * 100) : 0}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />完了 {doneRecords}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />進行中 {inProgressRecords}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" />未着手 {totalRecords - doneRecords - inProgressRecords}</span>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* 作業種別ごとの進捗 */}
        {byType.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">作業種別ごとの完了率</h2>
            <div className="space-y-3">
              {byType.map(wt => (
                <div key={wt.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: wt.color }} />
                      {wt.name}
                    </span>
                    <span>{wt.done}/{wt.total} ({wt.rate}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${wt.rate}%`, backgroundColor: wt.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 田んぼごとの進捗 */}
        {byField.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">田んぼごとの完了率</h2>
            <div className="space-y-3">
              {byField.map(f => (
                <div key={f.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{f.name}</span>
                    <span>{f.done}/{f.total} ({f.rate}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${f.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {totalRecords === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          作業記録がありません。地図から田んぼをクリックして作業を登録してください。
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border-green-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-70">{label}</div>
    </div>
  )
}
