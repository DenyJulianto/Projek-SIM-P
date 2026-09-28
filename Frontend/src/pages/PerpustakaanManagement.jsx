import { useState } from 'react'
import PerpusAnggotaTab from '../components/PerpusAnggotaTab'
import PerpusBukuTab from '../components/PerpusBukuTab'
import PerpusDashboardTab from '../components/PerpusDashboardTab'
import PerpusDendaTab from '../components/PerpusDendaTab'
import PerpusKegiatanTab from '../components/PerpusKegiatanTab'
import PerpusLaporanTab from '../components/PerpusLaporanTab'
import PerpusPengembalianTab from '../components/PerpusPengembalianTab'
import PerpusPeminjamanTab from '../components/PerpusPeminjamanTab'
import PerpusReservasiTab from '../components/PerpusReservasiTab'

const TABS = [
  ['dashboard', 'Dashboard'],
  ['buku', 'Koleksi Buku'],
  ['anggota', 'Anggota'],
  ['peminjaman', 'Peminjaman'],
  ['pengembalian', 'Pengembalian'],
  ['reservasi', 'Reservasi'],
  ['denda', 'Denda'],
  ['kegiatan', 'Kegiatan'],
  ['laporan', 'Laporan'],
]

export default function PerpustakaanManagement({ onBack }) {
  const [tab, setTab] = useState('dashboard')

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Perpustakaan</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">
          Koleksi buku, anggota, sirkulasi peminjaman &amp; pengembalian, reservasi, denda, kegiatan literasi, dan laporan perpustakaan.
        </p>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <PerpusDashboardTab onBuka={setTab} />}
      {tab === 'buku' && <PerpusBukuTab />}
      {tab === 'anggota' && <PerpusAnggotaTab />}
      {tab === 'peminjaman' && <PerpusPeminjamanTab />}
      {tab === 'pengembalian' && <PerpusPengembalianTab />}
      {tab === 'reservasi' && <PerpusReservasiTab />}
      {tab === 'denda' && <PerpusDendaTab />}
      {tab === 'kegiatan' && <PerpusKegiatanTab />}
      {tab === 'laporan' && <PerpusLaporanTab />}
    </div>
  )
}
