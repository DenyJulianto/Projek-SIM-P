import { useCallback, useEffect, useState } from 'react'
import EkskulDaftarTab from '../components/EkskulDaftarTab'
import EkskulKegiatanTab from '../components/EkskulKegiatanTab'
import EkskulKehadiranTab from '../components/EkskulKehadiranTab'
import EkskulLaporanTab from '../components/EkskulLaporanTab'
import EkskulPenilaianTab from '../components/EkskulPenilaianTab'
import EkskulPesertaTab from '../components/EkskulPesertaTab'
import { Kosong, Pesan } from '../components/PpdbUI'
import { selectClass } from '../components/ppdbKonstanta'
import { api } from '../lib/api'

const TABS = [
  ['daftar', 'Daftar Ekstrakurikuler'],
  ['peserta', 'Peserta'],
  ['kegiatan', 'Jadwal & Kegiatan'],
  ['kehadiran', 'Kehadiran'],
  ['penilaian', 'Penilaian'],
  ['laporan', 'Laporan'],
]

export default function EkskulManagement({ onBack, tabAwal = 'daftar' }) {
  const [opsi, setOpsi] = useState(null)
  const [tab, setTab] = useState(tabAwal)
  const [filter, setFilter] = useState({ tahun_ajaran_id: '', semester: '' })
  const [daftarEkskul, setDaftarEkskul] = useState([])
  const [kegiatanAwal, setKegiatanAwal] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .ekskulOpsi()
      .then((o) => {
        setOpsi(o)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        setFilter({ tahun_ajaran_id: aktif ? String(aktif.id) : '', semester: o.semester_aktif ?? '' })
      })
      .catch((e) => setError(e.message))
  }, [])

  const muatDaftar = useCallback(() => {
    if (!filter.tahun_ajaran_id) return Promise.resolve()
    return api
      .ekskulList(Object.fromEntries(Object.entries(filter).filter(([, v]) => v)))
      .then(setDaftarEkskul)
      .catch((e) => setError(e.message))
  }, [filter])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muatDaftar()
  }, [muatDaftar])

  if (!opsi) return <Kosong>{error || 'Memuat…'}</Kosong>

  return (
    <div>
      <div className="mb-5">
        {onBack && (
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-navy">Ekstrakurikuler</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">Kelola kegiatan ekstrakurikuler, peserta, jadwal, kehadiran, dan penilaian perkembangan siswa.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <select value={filter.tahun_ajaran_id} onChange={(e) => setFilter((f) => ({ ...f, tahun_ajaran_id: e.target.value }))} className={selectClass}>
          {opsi.tahun_ajaran.length === 0 && <option value="">Belum ada tahun ajaran</option>}
          {opsi.tahun_ajaran.map((t) => (
            <option key={t.id} value={t.id}>
              Tahun Ajaran {t.nama}
            </option>
          ))}
        </select>
        <select value={filter.semester} onChange={(e) => setFilter((f) => ({ ...f, semester: e.target.value }))} className={selectClass}>
          <option value="">Semua semester</option>
          <option value="ganjil">Semester Ganjil</option>
          <option value="genap">Semester Genap</option>
        </select>
        <span className="text-xs text-navy/40">{daftarEkskul.length} ekstrakurikuler pada periode ini</span>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
            {label}
          </button>
        ))}
      </div>

      <Pesan error={error} />

      {tab === 'daftar' && <EkskulDaftarTab opsi={opsi} filter={filter} onBerubah={muatDaftar} />}
      {tab === 'peserta' && <EkskulPesertaTab filter={filter} daftarEkskul={daftarEkskul} onBerubah={muatDaftar} />}
      {tab === 'kegiatan' && (
        <EkskulKegiatanTab
          opsi={opsi}
          filter={filter}
          daftarEkskul={daftarEkskul}
          onBerubah={muatDaftar}
          onPresensi={(id) => {
            setKegiatanAwal(id)
            setTab('kehadiran')
          }}
        />
      )}
      {tab === 'kehadiran' && <EkskulKehadiranTab key={kegiatanAwal ?? 'x'} filter={filter} daftarEkskul={daftarEkskul} kegiatanAwal={kegiatanAwal} onBerubah={muatDaftar} />}
      {tab === 'penilaian' && <EkskulPenilaianTab opsi={opsi} daftarEkskul={daftarEkskul} onBerubah={muatDaftar} />}
      {tab === 'laporan' && <EkskulLaporanTab filter={filter} daftarEkskul={daftarEkskul} />}
    </div>
  )
}
