import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

const INTERVAL_MUAT_ULANG_MS = 20000

export function waktuRelatif(iso) {
  const detik = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (detik < 60) return 'baru saja'
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * Notifikasi milik user yang login. Dimuat ulang berkala dan saat jendela
 * kembali fokus, supaya notifikasi baru (mis. siswa keluar dari halaman
 * kuis) muncul tanpa perlu refresh.
 */
export function useNotifikasi() {
  const [data, setData] = useState(null) // { belum_dibaca, data: [] }

  const muat = useCallback(() => {
    api.getNotifikasi().then(setData).catch(() => setData((d) => d ?? { belum_dibaca: 0, data: [] }))
  }, [])

  useEffect(() => {
    muat()
    const id = setInterval(muat, INTERVAL_MUAT_ULANG_MS)
    window.addEventListener('focus', muat)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', muat)
    }
  }, [muat])

  const tandaiDibaca = useCallback((n) => {
    if (n.dibaca_at) return
    setData((d) => ({
      belum_dibaca: Math.max(0, d.belum_dibaca - 1),
      data: d.data.map((x) => (x.id === n.id ? { ...x, dibaca_at: new Date().toISOString() } : x)),
    }))
    api.bacaNotifikasi(n.id).catch(() => {})
  }, [])

  const tandaiSemuaDibaca = useCallback(async () => {
    await api.bacaSemuaNotifikasi().catch(() => {})
    muat()
  }, [muat])

  return {
    daftar: data?.data ?? null,
    belumDibaca: data?.belum_dibaca ?? 0,
    muat,
    tandaiDibaca,
    tandaiSemuaDibaca,
  }
}

export const JENIS_NOTIFIKASI = {
  pelanggaran_ujian: { label: 'Kuis', ikon: '⚠', tone: 'bg-red-100 text-red-600' },
  tugas_dikumpulkan: { label: 'Tugas', ikon: '📄', tone: 'bg-blue-100 text-blue-600' },
  ujian_selesai: { label: 'Ujian Selesai', ikon: '✓', tone: 'bg-emerald-100 text-emerald-700' },
  izin_siswa: { label: 'Izin / Sakit', ikon: '✉', tone: 'bg-amber-100 text-amber-700' },
  pelanggaran_siswa: { label: 'Pelanggaran', ikon: '!', tone: 'bg-orange-100 text-orange-600 font-bold' },
}

export function NotifikasiItem({ n, onClick, ringkas = false }) {
  const jenis = JENIS_NOTIFIKASI[n.jenis] ?? { ikon: '•', tone: 'bg-navy/10 text-navy' }
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full text-left flex gap-3 rounded-xl transition-colors ${ringkas ? 'p-3' : 'p-4'} ${
        n.dibaca_at ? 'hover:bg-white/60' : 'bg-white/90 shadow-sm hover:bg-white'
      }`}
    >
      <span className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm ${jenis.tone}`}>
        {jenis.ikon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={`text-sm text-navy leading-snug ${n.dibaca_at ? 'font-medium' : 'font-bold'}`}>{n.judul}</span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-navy/40 whitespace-nowrap">{waktuRelatif(n.updated_at)}</span>
            {!n.dibaca_at && <span className="h-2 w-2 rounded-full bg-red-600" />}
          </span>
        </span>
        <span className={`block text-xs text-navy/60 mt-0.5 leading-snug ${ringkas ? 'line-clamp-1' : ''}`}>{n.pesan}</span>
      </span>
    </button>
  )
}

export function BellIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}
