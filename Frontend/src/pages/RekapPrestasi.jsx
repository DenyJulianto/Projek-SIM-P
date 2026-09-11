import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const TINGKAT_LABEL = {
  sekolah: 'Sekolah',
  kecamatan: 'Kecamatan',
  kabupaten_kota: 'Kab/Kota',
  provinsi: 'Provinsi',
  nasional: 'Nasional',
  internasional: 'Internasional',
}

export default function RekapPrestasi({ onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listPrestasi({ per_page: 200 })
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  const counts = {}
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
        <h1 className="text-2xl font-extrabold text-navy">Rekap Prestasi</h1>
      </div>

      {loading ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <RekapCard label="Total" value={items.length} tone="bg-navy text-white" />
            {Object.entries(TINGKAT_LABEL).map(([key, label]) => (
              <RekapCard key={key} label={label} value={counts[key] || 0} tone="bg-gold-light/40 text-navy" />
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Tingkat</th>
                  <th className="px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                      Belum ada prestasi tercatat.
                    </td>
                  </tr>
                ) : (
                  items.slice(0, 20).map((item) => (
                    <tr key={item.id} className="border-t border-navy/5">
                      <td className="px-4 py-3 font-medium text-navy">{item.siswa?.nama || '-'}</td>
                      <td className="px-4 py-3 text-navy/70">{item.judul}</td>
                      <td className="px-4 py-3 text-navy/70">{TINGKAT_LABEL[item.tingkat]}</td>
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
    <div className={`rounded-2xl p-4 ${tone}`}>
      <p className="text-xl font-extrabold leading-none">{value}</p>
      <p className="text-[10px] mt-1.5 uppercase tracking-wide opacity-70">{label}</p>
    </div>
  )
}
