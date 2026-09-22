import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Notifikasi dalam aplikasi milik pengguna yang login (mis. penugasan guru pengganti). */
export default function NotifikasiPanel() {
  const [data, setData] = useState(null)

  function load() {
    api
      .getMyNotifikasi()
      .then(setData)
      .catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  async function baca(id) {
    await api.bacaNotifikasi(id).catch(() => {})
    load()
  }

  async function bacaSemua() {
    await api.bacaSemuaNotifikasi().catch(() => {})
    load()
  }

  const belumDibaca = data?.data.filter((n) => !n.dibaca) ?? []
  if (belumDibaca.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-amber-900">Notifikasi ({data.belum_dibaca})</h2>
        <button onClick={bacaSemua} className="text-xs font-semibold text-amber-900 underline">
          Tandai semua dibaca
        </button>
      </div>
      <div className="space-y-2">
        {belumDibaca.map((n) => (
          <div key={n.id} className="bg-white rounded-xl border border-amber-100 p-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy">{n.judul}</p>
              <p className="text-xs text-navy/60">{n.pesan}</p>
              <p className="text-[11px] text-navy/40 mt-0.5">{new Date(n.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            <button onClick={() => baca(n.id)} className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-2.5 py-1 shrink-0 hover:bg-navy hover:text-white">
              Tandai dibaca
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
