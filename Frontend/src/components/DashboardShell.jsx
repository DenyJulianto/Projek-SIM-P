import { useEffect, useState } from 'react'
import { BASE_URL } from '../lib/api'
import { Ikon } from './DashIcons'
import LogoHorizontal from './LogoHorizontal'
import LogoutConfirmModal from './LogoutConfirmModal'
import NotifBell from './NotifBell'

export function Avatar({ user, className = 'h-10 w-10' }) {
  return user?.avatar_url ? (
    <img src={`${BASE_URL}${user.avatar_url}`} alt={user.name} className={`${className} rounded-full object-cover shrink-0 bg-white`} />
  ) : (
    <div className={`${className} rounded-full bg-emerald-100 text-navy font-bold flex items-center justify-center shrink-0`}>{(user?.name ?? '?').trim().charAt(0).toUpperCase()}</div>
  )
}

/**
 * Kerangka dashboard: sidebar hijau dengan menu berkelompok yang bisa dilipat, bilah atas (pencarian menu, notifikasi, profil),
 * dan area isi. `menu` berisi {section, items:[{key,label,icon}]}; `aktif` adalah kunci menu yang disorot (mis. induk dari halaman dalam).
 */
export default function DashboardShell({ menu, view, aktif, onNavigate, user, logout, peran, children }) {
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [terbuka, setTerbuka] = useState(null)
  const sorot = aktif ?? view

  useEffect(() => {
    const grup = menu.find((g) => g.section && g.items.some((i) => i.key === sorot))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (grup) setTerbuka(grup.section)
  }, [sorot, menu])

  const itemClass = (active) =>
    `w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left ${
      active ? 'bg-emerald-50 text-navy font-semibold shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`
  const butir = (item) => (
    <button key={item.key} onClick={() => onNavigate(item.key)} className={itemClass(sorot === item.key)}>
      <Ikon nama={item.icon} className="h-4.5 w-4.5 shrink-0" />
      <span className="truncate min-w-0">{item.label}</span>
    </button>
  )

  return (
    <div className="h-screen bg-[#f4faf7] flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-gradient-to-b from-[#0d5c40] to-[#0a3f2c] text-white flex flex-col pt-6 h-screen">
        <div className="flex items-center gap-2 px-6 mb-5">
          <LogoHorizontal />
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3">
          <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-white/55">Menu</p>
          {menu.map((group, gi) => {
            if (!group.section) {
              return (
                <div key={gi} className="space-y-1.5 pb-1.5">
                  {group.items.map(butir)}
                </div>
              )
            }
            const buka = terbuka === group.section
            const adaAktif = group.items.some((i) => i.key === sorot)
            return (
              <div key={gi} className="pb-1">
                <button
                  onClick={() => setTerbuka(buka ? null : group.section)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${adaAktif ? 'text-white' : 'text-white/55 hover:text-white/85'}`}
                >
                  <span className="truncate min-w-0">{group.section}</span>
                  <Ikon nama="chevron" className={`h-3.5 w-3.5 shrink-0 transition-transform ${buka ? 'rotate-180' : ''}`} />
                </button>
                {buka && <div className="space-y-1.5 mt-1">{group.items.map(butir)}</div>}
              </div>
            )
          })}
        </nav>
        <div className="mt-2 px-4 py-4 border-t border-white/10 flex items-center gap-3">
          <Avatar user={user} className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-white/60 truncate">{peran}</p>
          </div>
          <button onClick={() => setConfirmingLogout(true)} title="Keluar" className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            <Ikon nama="logout" className="h-5 w-5" />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <TopBar menu={menu} user={user} onNavigate={onNavigate} />
        {children}
      </main>

      {confirmingLogout && <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />}
    </div>
  )
}

function TopBar({ menu, user, onNavigate }) {
  const [q, setQ] = useState('')
  const [fokus, setFokus] = useState(false)
  const semua = menu.flatMap((g) => g.items.map((i) => ({ ...i, grup: g.section })))
  const kata = q.trim().toLowerCase()
  const hasil = kata ? semua.filter((i) => `${i.label} ${i.grup ?? ''}`.toLowerCase().includes(kata)).slice(0, 7) : []

  return (
    <header className="flex items-center gap-4 mb-5">
      <div className="relative flex-1 max-w-xl">
        <div className="flex items-center gap-3 bg-white rounded-full shadow-sm px-5 py-3">
          <Ikon nama="search" className="h-5 w-5 text-navy/50 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFokus(true)}
            onBlur={() => setTimeout(() => setFokus(false), 150)}
            placeholder="Cari menu atau fitur…"
            className="flex-1 min-w-0 bg-transparent text-sm text-navy placeholder:text-navy/40 outline-none"
          />
        </div>
        {fokus && kata && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-navy/10 z-30 overflow-hidden">
            {hasil.length === 0 ? (
              <p className="px-4 py-4 text-xs text-navy/40 text-center">Tidak ada menu yang cocok.</p>
            ) : (
              hasil.map((i) => (
                <button
                  key={i.key}
                  onMouseDown={() => {
                    onNavigate(i.key)
                    setQ('')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-emerald-50"
                >
                  <Ikon nama={i.icon} className="h-4.5 w-4.5 text-navy" />
                  <span className="text-sm font-semibold text-navy">{i.label}</span>
                  {i.grup && <span className="text-[11px] text-navy/40">{i.grup}</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <span className="flex-1" />
      <NotifBell />
      <button onClick={() => onNavigate('profile')} title="Profil Saya" className="flex items-center gap-3 bg-white rounded-full shadow-sm pl-2 pr-5 py-2 hover:bg-emerald-50">
        <Avatar user={user} className="h-9 w-9" />
        <span className="text-sm font-bold text-navy max-w-40 truncate">{user?.name}</span>
      </button>
    </header>
  )
}
