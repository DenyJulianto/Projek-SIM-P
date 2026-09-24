import { useEffect, useMemo, useState } from 'react'
import LaporanKesiswaanRunner from '../components/LaporanKesiswaanRunner'
import { ArsipLaporan, DashboardLaporan, FormMutasi, PemilihSiswa, PengaturanKop, RiwayatMutasi } from '../components/LaporanKesiswaanTabs'
import { Btn, Kosong, Pesan } from '../components/PpdbUI'
import { selectClass } from '../components/ppdbKonstanta'
import { api } from '../lib/api'

const TABS = [
  ['dashboard', 'Dashboard'],
  ['siswa', 'Data Siswa'],
  ['ppdb', 'PPDB'],
  ['kelas', 'Kelas & Rombel'],
  ['mutasi', 'Mutasi Siswa'],
  ['kehadiran', 'Kehadiran'],
  ['perkembangan', 'Perkembangan Siswa'],
  ['arsip', 'Arsip & Riwayat'],
  ['pengaturan', 'Kop & Tanda Tangan'],
]
const LAPORAN = ['siswa', 'ppdb', 'kelas', 'mutasi', 'kehadiran', 'perkembangan']

const STATUS_PPDB = [
  ['terverifikasi', 'Terverifikasi'],
  ['belum_diverifikasi', 'Belum diverifikasi'],
  ['ditolak', 'Ditolak verifikasi'],
  ['lolos', 'Lolos seleksi'],
  ['tidak_lolos', 'Tidak lolos'],
  ['sudah_daftar_ulang', 'Sudah daftar ulang'],
  ['belum_daftar_ulang', 'Belum daftar ulang'],
  ['diterima', 'Diterima'],
  ['dibatalkan', 'Pendaftaran dibatalkan'],
]
const STATUS_MUTASI = [
  ['tercatat', 'Tercatat'],
  ['dibatalkan', 'Dibatalkan'],
]
const KEHADIRAN_REKAP = [
  ['siswa', 'Per siswa'],
  ['kelas', 'Per kelas'],
  ['harian', 'Harian'],
  ['bulanan', 'Bulanan'],
  ['semester', 'Semester'],
]

export default function LaporanKesiswaanManagement({ onBack, tabAwal = 'dashboard', jenisMutasiAwal = '' }) {
  const [opsi, setOpsi] = useState(null)
  const [tab, setTab] = useState(tabAwal)
  const [f, setF] = useState({ tahun_ajaran_id: '', semester: '', dari: '', sampai: '', jenjang: '', tingkat: '', kelas_id: '', status: '' })
  const [search, setSearch] = useState('')
  const [jalur, setJalur] = useState('')
  const [jenisMutasi, setJenisMutasi] = useState(jenisMutasiAwal)
  const [rekap, setRekap] = useState('siswa')
  const [ambang, setAmbang] = useState('75')
  const [siswa, setSiswa] = useState(null)
  const [formMutasi, setFormMutasi] = useState(false)
  const [riwayat, setRiwayat] = useState(null)
  const [versi, setVersi] = useState(0)
  const [muatUlang, setMuatUlang] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    api
      .lkOpsi()
      .then((o) => {
        setOpsi(o)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        setF((x) => ({ ...x, tahun_ajaran_id: aktif ? String(aktif.id) : '', semester: o.semester_aktif ?? '' }))
      })
      .catch((e) => setError(e.message))
  }, [])

  const ta = opsi?.tahun_ajaran.find((t) => String(t.id) === f.tahun_ajaran_id)
  const kelasOpsi = useMemo(
    () => (opsi?.kelas ?? []).filter((k) => ta && (k.tahun_ajaran_id === ta.id || k.tahun_ajaran === ta.nama) && (!f.jenjang || k.jenjang === f.jenjang) && (!f.tingkat || k.tingkat === f.tingkat)),
    [opsi, ta, f.jenjang, f.tingkat],
  )
  const jalurOpsi = (opsi?.jalur ?? []).filter((j) => ta && j.tahun_ajaran_id === ta.id)

  const set = (k, v) => setF((x) => ({ ...x, [k]: v, ...(k === 'jenjang' || k === 'tingkat' ? { kelas_id: '' } : {}) }))
  const statusOpsi = tab === 'siswa' ? (opsi?.status_siswa ?? []).map((s) => [s.key, s.label]) : tab === 'ppdb' ? STATUS_PPDB : tab === 'mutasi' ? STATUS_MUTASI : null

  // Parameter laporan: filter umum + filter khusus tiap jenis laporan.
  const params = useMemo(() => {
    const p = { tahun_ajaran_id: f.tahun_ajaran_id, semester: f.semester, dari: f.dari, sampai: f.sampai }
    if (tab !== 'ppdb') Object.assign(p, { jenjang: f.jenjang, tingkat: f.tingkat, kelas_id: f.kelas_id })
    if (statusOpsi) p.status = f.status
    if (tab === 'siswa' || tab === 'mutasi' || tab === 'kehadiran') p.search = search
    if (tab === 'ppdb') p.jalur_id = jalur
    if (tab === 'mutasi') p.jenis_mutasi = jenisMutasi
    if (tab === 'kehadiran') Object.assign(p, { rekap, ambang })
    if (tab === 'perkembangan') p.siswa_id = siswa?.id ?? ''
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v !== undefined && v !== null))
  }, [f, tab, search, jalur, jenisMutasi, rekap, ambang, siswa, statusOpsi])

  if (!opsi) return <Kosong>{error || 'Memuat…'}</Kosong>

  const laporanTab = LAPORAN.includes(tab)
  const semuaTab = laporanTab || tab === 'dashboard'
  const arsipBaru = () => setVersi((v) => v + 1)
  const label = 'text-[11px] font-semibold text-navy/50'

  const aksiMutasi = {
    tabel: 'data',
    render: (b) => (
      <span className="space-x-1">
        {b._mutasi_id && b._nomor_surat && !b._batal && (
          <Btn kecil onClick={() => api.lkSuratMutasi(b._mutasi_id, `surat-mutasi-${b.nis}.pdf`).catch((e) => setError(e.message))}>
            Surat
          </Btn>
        )}
        {b._mutasi_id && !b._batal && (
          <Btn
            kecil
            bahaya
            onClick={async () => {
              const alasan = window.prompt('Alasan membatalkan catatan mutasi:')
              if (!alasan) return
              const pulihkan = b.jenis !== 'masuk' && window.confirm('Kembalikan status siswa menjadi Aktif (bila status diubah oleh catatan ini)?')
              try {
                await api.lkBatalMutasi(b._mutasi_id, { alasan, pulihkan_status: pulihkan })
                setInfo('Catatan mutasi dibatalkan.')
                setMuatUlang((v) => v + 1)
              } catch (e) {
                setError(e.message)
              }
            }}
          >
            Batalkan
          </Btn>
        )}
        {b._siswa_id && (
          <Btn kecil onClick={() => setRiwayat({ id: b._siswa_id, nama: b.nama })}>
            Riwayat
          </Btn>
        )}
      </span>
    ),
  }

  return (
    <div>
      <div className="mb-5">
        {onBack && (
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-navy">Laporan Kesiswaan</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">Laporan dihitung langsung dari data Siswa, PPDB, Kelas & Rombel, Kehadiran, Pelanggaran, Prestasi, dan Ekstrakurikuler — tanpa input ulang.</p>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4 overflow-x-auto">
        {TABS.map(([key, l]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
            {l}
          </button>
        ))}
      </div>

      {semuaTab && (
        <div className="bg-white border border-navy/10 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            <label className="block">
              <span className={label}>Tahun Ajaran</span>
              <select value={f.tahun_ajaran_id} onChange={(e) => set('tahun_ajaran_id', e.target.value)} className={`${selectClass} w-full mt-1`}>
                {opsi.tahun_ajaran.length === 0 && <option value="">Belum ada</option>}
                {opsi.tahun_ajaran.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Semester</span>
              <select value={f.semester} onChange={(e) => set('semester', e.target.value)} className={`${selectClass} w-full mt-1`}>
                <option value="">Semua / setahun</option>
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </label>
            {laporanTab && ['kehadiran', 'mutasi', 'perkembangan'].includes(tab) && (
              <>
                <label className="block">
                  <span className={label}>Periode dari</span>
                  <input type="date" value={f.dari} onChange={(e) => set('dari', e.target.value)} className={`${selectClass} w-full mt-1`} />
                </label>
                <label className="block">
                  <span className={label}>Periode sampai</span>
                  <input type="date" value={f.sampai} onChange={(e) => set('sampai', e.target.value)} className={`${selectClass} w-full mt-1`} />
                </label>
              </>
            )}
            {laporanTab && tab !== 'ppdb' && tab !== 'perkembangan' && (
              <>
                <label className="block">
                  <span className={label}>Jenjang</span>
                  <select value={f.jenjang} onChange={(e) => set('jenjang', e.target.value)} className={`${selectClass} w-full mt-1`}>
                    <option value="">Semua</option>
                    {opsi.jenjang.map((j) => (
                      <option key={j}>{j}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={label}>Kelas (tingkat)</span>
                  <select value={f.tingkat} onChange={(e) => set('tingkat', e.target.value)} className={`${selectClass} w-full mt-1`}>
                    <option value="">Semua</option>
                    {opsi.tingkat.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={label}>Rombel</span>
                  <select value={f.kelas_id} onChange={(e) => set('kelas_id', e.target.value)} className={`${selectClass} w-full mt-1`}>
                    <option value="">Semua</option>
                    {kelasOpsi.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {laporanTab && statusOpsi && (
              <label className="block">
                <span className={label}>Status</span>
                <select value={f.status} onChange={(e) => set('status', e.target.value)} className={`${selectClass} w-full mt-1`}>
                  <option value="">Semua</option>
                  {statusOpsi.map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tab === 'ppdb' && (
              <label className="block">
                <span className={label}>Jalur PPDB</span>
                <select value={jalur} onChange={(e) => setJalur(e.target.value)} className={`${selectClass} w-full mt-1`}>
                  <option value="">Semua jalur</option>
                  {jalurOpsi.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tab === 'mutasi' && (
              <label className="block">
                <span className={label}>Jenis mutasi</span>
                <select value={jenisMutasi} onChange={(e) => setJenisMutasi(e.target.value)} className={`${selectClass} w-full mt-1`}>
                  <option value="">Semua</option>
                  {opsi.jenis_mutasi.map((j) => (
                    <option key={j.key} value={j.key}>
                      {j.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tab === 'kehadiran' && (
              <>
                <label className="block">
                  <span className={label}>Bentuk rekap</span>
                  <select value={rekap} onChange={(e) => setRekap(e.target.value)} className={`${selectClass} w-full mt-1`}>
                    {KEHADIRAN_REKAP.map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={label}>Kehadiran rendah bila &lt; (%)</span>
                  <input type="number" min="1" max="100" value={ambang} onChange={(e) => setAmbang(e.target.value)} className={`${selectClass} w-full mt-1`} />
                </label>
              </>
            )}
            {['siswa', 'mutasi', 'kehadiran'].includes(tab) && (
              <label className="block">
                <span className={label}>Cari siswa</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nama / NIS / NISN" className={`${selectClass} w-full mt-1`} />
              </label>
            )}
            {tab === 'perkembangan' && (
              <div className="col-span-2">
                <span className={label}>Pilih siswa</span>
                <div className="mt-1">
                  <PemilihSiswa terpilih={siswa} onPilih={setSiswa} />
                </div>
              </div>
            )}
          </div>
          {laporanTab && ['kehadiran', 'mutasi', 'perkembangan'].includes(tab) && <p className="text-[11px] text-navy/40 mt-2">Periode kosong = rentang semester terpilih (atau seluruh tahun ajaran bila semester “Semua”).</p>}
        </div>
      )}

      <Pesan error={error} info={info} />

      {tab === 'dashboard' && <DashboardLaporan filter={f} onBuka={setTab} versi={versi} />}

      {laporanTab && (
        <>
          {tab === 'mutasi' && (
            <div className="flex justify-end mb-3">
              <Btn utama onClick={() => setFormMutasi(true)}>
                + Catat Mutasi
              </Btn>
            </div>
          )}
          <LaporanKesiswaanRunner
            key={tab}
            jenis={tab}
            params={params}
            opsi={opsi}
            siap={tab !== 'perkembangan' || Boolean(siswa)}
            pesanSiap="Pilih siswa terlebih dahulu untuk melihat profil perkembangan kesiswaannya."
            aksiBaris={tab === 'mutasi' ? aksiMutasi : undefined}
            muatUlang={muatUlang}
            onArsipBaru={arsipBaru}
            onBukaPengaturan={() => setTab('pengaturan')}
          />
        </>
      )}

      {tab === 'arsip' && <ArsipLaporan opsi={opsi} versi={versi} onBerubah={arsipBaru} />}
      {tab === 'pengaturan' && <PengaturanKop />}

      {formMutasi && (
        <FormMutasi
          onClose={() => setFormMutasi(false)}
          jenisAwal={jenisMutasiAwal || 'keluar'}
          onSaved={() => {
            setFormMutasi(false)
            setInfo('Mutasi dicatat.')
            setMuatUlang((v) => v + 1)
          }}
        />
      )}
      {riwayat && <RiwayatMutasi siswaId={riwayat.id} nama={riwayat.nama} onClose={() => setRiwayat(null)} />}
    </div>
  )
}
