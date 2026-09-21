import { useEffect, useRef, useState } from 'react'

const GAYA = {
  mendesak: { titik: 'bg-red-500', kotak: 'bg-red-50 border-red-200 text-red-800', label: 'Mendesak' },
  peringatan: { titik: 'bg-amber-500', kotak: 'bg-amber-50 border-amber-200 text-amber-800', label: 'Perlu tindakan' },
  info: { titik: 'bg-sky-500', kotak: 'bg-sky-50 border-sky-200 text-sky-800', label: 'Info' },
}

const NAMA_TAB = {
  pengaturan: 'Pengaturan',
  verifikasi: 'Verifikasi',
  seleksi: 'Seleksi',
  pengumuman: 'Pengumuman',
  'daftar-ulang': 'Daftar Ulang',
  diterima: 'Peserta Diterima',
}

/** Daftar notifikasi PPDB; klik untuk membuka tab yang bersangkutan. */
export function DaftarNotifikasi({ data, onBuka, kompak = false }) {
  if (!data) return null
  if (data.data.length === 0) return <p className="text-xs text-navy/40 py-4 text-center">Tidak ada yang perlu ditindaklanjuti saat ini.</p>
  return (
    <ul className="space-y-2">
      {data.data.map((n, i) => {
        const g = GAYA[n.tingkat]
        return (
          <li key={i}>
            <button onClick={() => onBuka(n.tab)} className={`w-full text-left flex items-start gap-3 border rounded-xl px-3 py-2 ${g.kotak} hover:shadow-sm`}>
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${g.titik}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{n.pesan}</span>
                {!kompak && (
                  <span className="block text-[11px] opacity-70">
                    {g.label} · buka {NAMA_TAB[n.tab] ?? n.tab}
                  </span>
                )}
              </span>
              <span className="text-lg leading-none opacity-40">›</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function LoncengNotifikasi({ data, onBuka }) {
  const [buka, setBuka] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!buka) return
    const tutup = (e) => ref.current && !ref.current.contains(e.target) && setBuka(false)
    document.addEventListener('mousedown', tutup)
    return () => document.removeEventListener('mousedown', tutup)
  }, [buka])

  const jumlah = data?.perlu_tindakan ?? 0
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setBuka((b) => !b)} title="Notifikasi PPDB" className="relative h-10 w-10 rounded-full bg-white border border-navy/10 flex items-center justify-center text-navy hover:bg-navy/5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {jumlah > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{jumlah}</span>}
      </button>
      {buka && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-2xl shadow-lg border border-navy/10 z-30 p-3">
          <p className="text-sm font-bold text-navy px-1 mb-2">Notifikasi PPDB</p>
          <div className="max-h-96 overflow-y-auto">
            <DaftarNotifikasi
              data={data}
              kompak
              onBuka={(t) => {
                setBuka(false)
                onBuka(t)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
