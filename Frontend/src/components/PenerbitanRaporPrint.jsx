import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import RaporDocument from './RaporDocument'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #rapor-print, #rapor-print * { visibility: visible !important; }
  #rapor-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  #rapor-print .rapor-lembar { border: none !important; border-radius: 0 !important; padding: 0 !important; }
  .rapor-noprint { display: none !important; }
  @page { size: A4 portrait; margin: 14mm; }
}
`

/**
 * Cetak satu atau banyak rapor, satu halaman per siswa. `items` untuk cetak
 * langsung (satu siswa); `kelasParams` untuk memuat seluruh rapor rombel.
 */
export default function PenerbitanRaporPrint({ items, kelasParams, onClose }) {
  const [data, setData] = useState(items ?? null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (items || !kelasParams) return
    api
      .getCetakKelasRapor(kelasParams)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [items, kelasParams])

  return (
    <div className="fixed inset-0 z-[60] bg-gray-100 overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="rapor-noprint sticky top-0 z-10 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Rapor{data ? ` — ${data.length} lembar` : ''}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} disabled={!data || data.length === 0} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-50">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm p-6">{error}</p>}
      {data && data.length === 0 && <p className="text-sm p-6 text-navy/60">Belum ada rapor yang digenerate untuk dicetak.</p>}

      {data && data.length > 0 && (
        <div id="rapor-print" className="max-w-[800px] mx-auto py-6 space-y-6">
          {data.map((k) => (
            <RaporDocument key={k.siswa.id} konten={k} />
          ))}
        </div>
      )}
    </div>
  )
}
