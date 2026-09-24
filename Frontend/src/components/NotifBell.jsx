import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

/** Lonceng notifikasi dalam aplikasi (dropdown) untuk pengguna yang login. */
export default function NotifBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ belum_dibaca: 0, data: [] })
  const ref = useRef(null)

  const muat = () => api.getMyNotifikasi().then(setData).catch(() => {})

  useEffect(() => {
    muat()
  }, [])

  useEffect(() => {
    if (!open) return
    const tutup = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', tutup)
    return () => document.removeEventListener('mousedown', tutup)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-navy hover:bg-emerald-50" title="Notifikasi">
        <BellIcon className="h-6 w-6" />
        {data.belum_dibaca > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{data.belum_dibaca}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-navy/10 z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy/5">
            <p className="text-sm font-bold text-navy">Notifikasi</p>
            {data.belum_dibaca > 0 && (
              <button onClick={() => api.bacaSemuaNotifikasi().then(muat).catch(() => {})} className="text-xs font-semibold text-navy-light hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-navy/5">
            {data.data.length === 0 && <p className="px-4 py-6 text-center text-xs text-navy/40">Belum ada notifikasi.</p>}
            {data.data.map((n) => (
              <button key={n.id} onClick={() => !n.dibaca && api.bacaNotifikasi(n.id).then(muat).catch(() => {})} className={`w-full text-left px-4 py-3 ${n.dibaca ? '' : 'bg-emerald-50/60'}`}>
                <p className="text-sm font-semibold text-navy">{n.judul}</p>
                <p className="text-xs text-navy/60 mt-0.5">{n.pesan}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BellIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
