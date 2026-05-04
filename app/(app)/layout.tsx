import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import type { Profile } from '@/lib/supabase/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'name' | 'role'> | null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">🌾 田んぼ管理</span>
          <nav className="hidden sm:flex gap-3 text-sm">
            <Link href="/map" className="hover:underline opacity-90 hover:opacity-100">地図</Link>
            <Link href="/fields" className="hover:underline opacity-90 hover:opacity-100">田んぼ一覧</Link>
            <Link href="/work-types" className="hover:underline opacity-90 hover:opacity-100">作業種別</Link>
            {profile?.role === 'admin' && (
              <Link href="/users" className="hover:underline opacity-90 hover:opacity-100">ユーザー管理</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline">{profile?.name ?? user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
