import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { BatangMendatar, Kartu, Kosong, Panel, Pesan } from './PerpusUI'
import { waktu } from './perpusKonstanta'

export default function PerpusDashboardTab({ onBuka }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let batal = false
    api
      .perpusDashboard()
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Kartu label="Total Koleksi (Eksemplar)" nilai={k.total_koleksi} tone="teal" />
        <Kartu label="Total Judul Buku" nilai={k.total_judul_buku} tone="biru" />
        <Kartu label="Total Anggota Aktif" nilai={k.total_anggota} tone="ungu" />
        <Kartu label="Buku Sedang Dipinjam" nilai={k.buku_dipinjam} tone="hijau" />
        <Kartu label="Buku Terlambat" nilai={k.buku_terlambat} tone={k.buku_terlambat > 0 ? 'merah' : 'hijau'} />
        <Kartu label="Buku Rusak / Hilang" nilai={k.buku_rusak_hilang} tone="oranye" />
        <Kartu label="Peminjaman Hari Ini" nilai={k.peminjaman_hari_ini} tone="biru" />
        <Kartu label="Pengembalian Hari Ini" nilai={k.pengembalian_hari_ini} tone="hijau" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel judul="Peminjaman per Bulan">
          <BatangMendatar data={d.grafik.peminjaman_per_bulan} warna="bg-sky-500" labelKey="bulan" />
        </Panel>
        <Panel judul="Pengembalian per Bulan">
          <BatangMendatar data={d.grafik.pengembalian_per_bulan} warna="bg-emerald-500" labelKey="bulan" />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel judul="Buku Paling Banyak Dipinjam">
          <BatangMendatar data={d.grafik.buku_terpopuler.map((b) => ({ nama: b.judul, jumlah: b.total }))} warna="bg-violet-500" />
        </Panel>
        <Panel judul="Peminjaman Berdasarkan Kelas">
          <BatangMendatar data={d.grafik.peminjaman_per_kelas.map((b) => ({ nama: b.kelas, jumlah: b.total }))} warna="bg-amber-500" />
        </Panel>
      </div>

      <Panel judul="Aktivitas Perpustakaan Terbaru">
        {d.aktivitas.length === 0 ? (
          <Kosong>Belum ada aktivitas.</Kosong>
        ) : (
          <ul className="divide-y divide-navy/5">
            {d.aktivitas.map((a, i) => (
              <li key={i} className="py-2 flex items-center justify-between gap-2">
                <span className="text-sm text-navy">{a.pesan}</span>
                <span className="text-[11px] text-navy/40 whitespace-nowrap">{waktu(a.waktu)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {onBuka && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onBuka('buku')} className="text-xs font-semibold text-navy-light hover:underline">
            Kelola Koleksi Buku →
          </button>
          <span className="text-navy/20">·</span>
          <button onClick={() => onBuka('peminjaman')} className="text-xs font-semibold text-navy-light hover:underline">
            Peminjaman Baru →
          </button>
        </div>
      )}
    </div>
  )
}
