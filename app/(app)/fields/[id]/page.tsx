import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WorkRecordForm from '@/components/fields/WorkRecordForm'
import FieldEditor from './FieldEditor'
import { ChevronLeft } from 'lucide-react'
import type { Field, WorkType, WorkRecord, Profile } from '@/lib/supabase/types'

export default async function FieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [fieldRes, workTypesRes, recordsRes, userRes] = await Promise.all([
    supabase.from('fields').select('*').eq('id', id).single(),
    supabase.from('work_types').select('*').order('sort_order'),
    supabase.from('work_records').select('*').eq('field_id', id),
    supabase.auth.getUser(),
  ])

  const field = fieldRes.data as Field | null
  if (!field) notFound()

  const workTypes = (workTypesRes.data ?? []) as WorkType[]
  const records = (recordsRes.data ?? []) as WorkRecord[]

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userRes.data.user?.id ?? '')
    .single()

  const profile = profileData as Pick<Profile, 'role'> | null
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Link href="/fields" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> 田んぼ一覧に戻る
      </Link>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{field.name}</h1>
            <div className="mt-1 text-sm text-gray-500 space-y-0.5">
              {field.owner && <p>所有者: {field.owner}</p>}
              {field.area_ha && <p>面積: {(field.area_ha * 100).toFixed(1)} アール</p>}
              {field.fude_id && <p className="text-xs text-gray-400">筆ID: {field.fude_id}</p>}
            </div>
            {field.notes && <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">{field.notes}</p>}
          </div>
          {isAdmin && <FieldEditor field={field} />}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">作業進捗</h2>
        <Link href="/work-types" className="text-xs text-green-600 hover:underline">
          作業種別を管理 →
        </Link>
      </div>

      <WorkRecordForm fieldId={id} workTypes={workTypes} existingRecords={records} />
    </div>
  )
}
