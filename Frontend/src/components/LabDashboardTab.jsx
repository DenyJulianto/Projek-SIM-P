import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Kartu, Kosong, Panel, Pesan } from './LabUI'

export default function LabDashboardTab({ onBuka }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let batal = false
    api
      .labDashboard()
      .then((r) => !batal && setD(r))
      .catch((e) => !batal && setError(e.message))
    return () => {
      batal = true
    }
  }, [])

  if (error) return <Pesan error={error} />
  if (!d) return <Kosong>Memuat dashboard…</Kosong>

  const k = d.kartu

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kartu label="Total Laboratorium" nilai={k.total_laboratorium} tone="teal" />
        <Kartu label="Total Peralatan" nilai={k.total_peralatan} tone="biru" />
        <Kartu label="Peralatan Baik" nilai={k.peralatan_baik} tone="hijau" />
        <Kartu label="Peralatan Rusak" nilai={k.peralatan_rusak} tone={k.peralatan_rusak > 0 ? 'merah' : 'hijau'} />
        <Kartu label="Sedang Diperbaiki" nilai={k.peralatan_diperbaiki} tone="oranye" />
        <Kartu label="Peminjaman Aktif" nilai={k.peminjaman_aktif} tone="ungu" />
        <Kartu label="Jadwal Hari Ini" nilai={k.jadwal_hari_ini} tone="biru" />
        <Kartu label="Bahan Hampir Habis" nilai={k.bahan_hampir_habis} tone={k.bahan_hampir_habis > 0 ? 'merah' : 'hijau'} />
      </div>

      <Panel judul="Peringatan">
        {d.peringatan.length === 0 ? (
          <Kosong>Tidak ada peringatan saat ini.</Kosong>
        ) : (
          <ul className="space-y-2">
            {d.peringatan.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <span>⚠</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {onBuka && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onBuka('peralatan')} className="text-xs font-semibold text-navy-light hover:underline">
            Kelola Peralatan →
          </button>
          <span className="text-navy/20">·</span>
          <button onClick={() => onBuka('peminjaman')} className="text-xs font-semibold text-navy-light hover:underline">
            Peminjaman Alat →
          </button>
        </div>
      )}
    </div>
  )
}
