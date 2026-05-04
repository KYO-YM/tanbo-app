import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import NavMenu from './NavMenu'
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
  const userName = profile?.name ?? user.email ?? ''
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/map" className="font-bold text-lg">🌾 田んぼ管理</Link>
          <NavMenu isAdmin={isAdmin} userName={userName} onLogout={() => {}} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline">{userName}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
