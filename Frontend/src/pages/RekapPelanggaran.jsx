import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const TINGKAT_TONE = {
  ringan: 'bg-navy/10 text-navy/60',
  sedang: 'bg-amber-100 text-amber-700',
  berat: 'bg-red-100 text-red-600',
}

export default function RekapPelanggaran({ onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listPelanggaran({ per_page: 200 })
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  const counts = { ringan: 0, sedang: 0, berat: 0 }
  items.forEach((i) => {
    counts[i.tingkat] = (counts[i.tingkat] || 0) + 1
  })

  return (
    <div>
      <div className="mb-6">
        {onBack && (
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-navy">Rekap Pelanggaran</h1>
      </div>

      {loading ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <RekapCard label="Total Kasus" value={items.length} tone="bg-navy text-white" />
            <RekapCard label="Ringan" value={counts.ringan} tone="bg-navy/5 text-navy" />
            <RekapCard label="Sedang" value={counts.sedang} tone="bg-amber-100 text-amber-700" />
            <RekapCard label="Berat" value={counts.berat} tone="bg-red-100 text-red-600" />
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Tingkat</th>
                  <th className="px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                      Belum ada catatan pelanggaran.
                    </td>
                  </tr>
                ) : (
                  items.slice(0, 20).map((item) => (
                    <tr key={item.id} className="border-t border-navy/5">
                      <td className="px-4 py-3 font-medium text-navy">{item.siswa?.nama || '-'}</td>
                      <td className="px-4 py-3 text-navy/70">{item.jenis}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TINGKAT_TONE[item.tingkat]}`}>
                          {item.tingkat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy/70">{item.tanggal?.slice(0, 10)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function RekapCard({ label, value, tone }) {
  return (
    <div className={`rounded-2xl p-5 ${tone}`}>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="text-xs mt-1.5 uppercase tracking-wide opacity-70">{label}</p>
    </div>
  )
}
