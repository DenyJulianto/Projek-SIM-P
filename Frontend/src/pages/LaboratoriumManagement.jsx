import { useState } from 'react'
import LabBahanTab from '../components/LabBahanTab'
import LabDashboardTab from '../components/LabDashboardTab'
import LabDataLabTab from '../components/LabDataLabTab'
import LabJadwalTab from '../components/LabJadwalTab'
import LabKegiatanTab from '../components/LabKegiatanTab'
import LabLaporanTab from '../components/LabLaporanTab'
import LabPemeliharaanTab from '../components/LabPemeliharaanTab'
import LabPeminjamanTab from '../components/LabPeminjamanTab'
import LabPeralatanTab from '../components/LabPeralatanTab'

const TABS = [
  ['dashboard', 'Dashboard'],
  ['lab', 'Data Laboratorium'],
  ['peralatan', 'Peralatan & Inventaris'],
  ['jadwal', 'Jadwal Penggunaan'],
  ['peminjaman', 'Peminjaman Alat'],
  ['pemeliharaan', 'Pemeliharaan'],
  ['bahan', 'Bahan & Persediaan'],
  ['kegiatan', 'Kegiatan'],
  ['laporan', 'Laporan'],
]

export default function LaboratoriumManagement({ onBack }) {
  const [tab, setTab] = useState('dashboard')

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Laboratorium</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">
          Ruang laboratorium, peralatan &amp; inventaris (terhubung dengan Sarpras), jadwal penggunaan, peminjaman alat, pemeliharaan, bahan praktikum, kegiatan, dan laporan.
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

      {tab === 'dashboard' && <LabDashboardTab onBuka={setTab} />}
      {tab === 'lab' && <LabDataLabTab />}
      {tab === 'peralatan' && <LabPeralatanTab />}
      {tab === 'jadwal' && <LabJadwalTab />}
      {tab === 'peminjaman' && <LabPeminjamanTab />}
      {tab === 'pemeliharaan' && <LabPemeliharaanTab />}
      {tab === 'bahan' && <LabBahanTab />}
      {tab === 'kegiatan' && <LabKegiatanTab />}
      {tab === 'laporan' && <LabLaporanTab />}
    </div>
  )
}
