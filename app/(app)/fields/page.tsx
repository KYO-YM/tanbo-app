import { createClient } from '@/lib/supabase/server'
import FieldImporter from '@/components/fields/FieldImporter'
import FieldDeleteButton from '@/components/fields/FieldDeleteButton'
import FieldEditButton from '@/components/fields/FieldEditButton'
import FieldsCsvExport from '@/components/fields/FieldsCsvExport'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { Field } from '@/lib/supabase/types'

export default async function FieldsPage() {
  const supabase = await createClient()
  const { data: fieldsData } = await supabase
    .from('fields')
    .select('*')
    .order('name')

  const fields = (fieldsData ?? []) as Field[]

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">田んぼ一覧</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{fields.length} 枚登録済み</span>
          <FieldsCsvExport fields={fields} />
        </div>
      </div>

      <FieldImporter />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">田んぼ名</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">所有者</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">面積</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fields.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{f.owner ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {f.area_ha ? `${(f.area_ha * 100).toFixed(1)} a` : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <FieldEditButton fieldId={f.id} fieldName={f.name} fieldOwner={f.owner} />
                    <Link
                      href={`/fields/${f.id}`}
                      className="text-green-600 hover:underline text-xs font-medium px-1"
                    >
                      詳細
                    </Link>
                    <FieldDeleteButton fieldId={f.id} fieldName={f.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {fields.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MapPin size={32} className="mx-auto mb-2 opacity-30" />
            <p>田んぼが登録されていません</p>
            <p className="text-xs mt-1">上の「筆ポリゴンデータ取込」からデータを読み込んでください</p>
          </div>
        )}
      </div>
    </div>
  )
}
