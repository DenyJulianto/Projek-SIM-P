import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

const INTERVAL_MUAT_ULANG_MS = 20000

function waktuRelatif(iso) {
  const detik = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (detik < 60) return 'baru saja'
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * Lonceng notifikasi dengan jumlah belum dibaca. Daftar dimuat ulang
 * berkala dan saat jendela kembali fokus, supaya notifikasi baru (mis.
 * siswa keluar dari halaman kuis) muncul tanpa perlu refresh.
 */
export default function NotifikasiBell({ onPilih }) {
  const [buka, setBuka] = useState(false)
  const [data, setData] = useState({ belum_dibaca: 0, data: [] })

  const muat = useCallback(() => {
    api.getNotifikasi().then(setData).catch(() => {})
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

  async function pilih(n) {
    setBuka(false)
    if (!n.dibaca_at) {
      setData((d) => ({
        belum_dibaca: Math.max(0, d.belum_dibaca - 1),
        data: d.data.map((x) => (x.id === n.id ? { ...x, dibaca_at: new Date().toISOString() } : x)),
      }))
      api.bacaNotifikasi(n.id).catch(() => {})
    }
    onPilih?.(n)
  }

  async function bacaSemua() {
    await api.bacaSemuaNotifikasi().catch(() => {})
    muat()
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setBuka((v) => !v)
          if (!buka) muat()
        }}
        aria-label="Notifikasi"
        className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
          buka ? 'bg-navy text-white shadow-sm' : 'bg-white text-navy/70 shadow-sm hover:text-navy'
        }`}
      >
        <BellIcon className="h-5 w-5" />
        {data.belum_dibaca > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {data.belum_dibaca > 99 ? '99+' : data.belum_dibaca}
          </span>
        )}
      </button>

      {buka && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setBuka(false)} />
          <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-navy/10 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy/10">
              <p className="text-sm font-bold text-navy">Notifikasi</p>
              {data.belum_dibaca > 0 && (
                <button onClick={bacaSemua} className="text-xs font-semibold text-navy/50 hover:text-navy">
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {data.data.length === 0 && <p className="text-sm text-navy/40 text-center py-8">Belum ada notifikasi.</p>}
              {data.data.map((n) => (
                <button
                  key={n.id}
                  onClick={() => pilih(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 border-b border-navy/5 last:border-0 hover:bg-navy/[0.03] transition-colors ${
                    n.dibaca_at ? '' : 'bg-red-50/60'
                  }`}
                >
                  <span
                    className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm ${
                      n.jenis === 'pelanggaran_ujian' ? 'bg-red-100 text-red-600' : 'bg-navy/10 text-navy'
                    }`}
                  >
                    {n.jenis === 'pelanggaran_ujian' ? '⚠' : '•'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={`text-sm text-navy leading-snug ${n.dibaca_at ? 'font-medium' : 'font-bold'}`}>
                        {n.judul}
                      </span>
                      {!n.dibaca_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600" />}
                    </span>
                    <span className="block text-xs text-navy/60 mt-0.5 leading-snug">{n.pesan}</span>
                    <span className="block text-[11px] text-navy/40 mt-1">{waktuRelatif(n.updated_at)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BellIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}
