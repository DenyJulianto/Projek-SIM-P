import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function StatistikSiswa({ onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listSiswa({ per_page: 500 })
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  const byStatus = {}
  const byGender = { L: 0, P: 0 }
  items.forEach((s) => {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1
    if (s.jenis_kelamin) byGender[s.jenis_kelamin] = (byGender[s.jenis_kelamin] || 0) + 1
  })

  return (
    <div>
      <div className="mb-6">
        {onBack && (
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-navy">Statistik Siswa</h1>
      </div>

      {loading ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <h2 className="text-sm font-bold text-navy mb-4">Total Siswa</h2>
            <p className="text-4xl font-extrabold text-navy">{items.length}</p>
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <h2 className="text-sm font-bold text-navy mb-4">Berdasarkan Jenis Kelamin</h2>
            <div className="flex gap-4">
              <div>
                <p className="text-2xl font-extrabold text-navy">{byGender.L}</p>
                <p className="text-xs text-navy/50">Laki-laki</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-navy">{byGender.P}</p>
                <p className="text-xs text-navy/50">Perempuan</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5 sm:col-span-2">
            <h2 className="text-sm font-bold text-navy mb-4">Berdasarkan Status</h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status}>
                  <p className="text-2xl font-extrabold text-navy">{count}</p>
                  <p className="text-xs text-navy/50 capitalize">{status}</p>
                </div>
              ))}
              {Object.keys(byStatus).length === 0 && (
                <p className="text-sm text-navy/40">Belum ada data siswa.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
