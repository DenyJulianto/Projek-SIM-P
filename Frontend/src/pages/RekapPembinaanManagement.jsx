import { useEffect, useMemo, useState } from 'react'
import { AnalisisPembinaan, IdentitasSiswa, LaporanPembinaan, PemilihSiswaRekap, RingkasanPembinaan, TimelinePembinaan } from '../components/RekapPembinaanBagian'
import { TabPelanggaran, TabPrestasi, TabTindakLanjut } from '../components/RekapPembinaanRiwayat'
import { Field, Kosong, Pesan } from '../components/PpdbUI'
import { selectClass } from '../components/ppdbKonstanta'
import { api } from '../lib/api'

const TABS = [
  ['pelanggaran', 'Riwayat Pelanggaran'],
  ['prestasi', 'Riwayat Prestasi'],
  ['timeline', 'Timeline'],
  ['tindak-lanjut', 'Tindak Lanjut'],
  ['analisis', 'Analisis'],
  ['laporan', 'Laporan & Cetak'],
]

const bersih = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== null && v !== undefined))

/** Rekap Pembinaan: gambaran pembinaan satu siswa (pelanggaran, prestasi, tindak lanjut) — pelanggaran dan prestasi tidak digabung menjadi skor. */
export default function RekapPembinaanManagement({ onBack }) {
  const [opsi, setOpsi] = useState(null)
  const [siswa, setSiswa] = useState(null)
  const [profil, setProfil] = useState(null)
  const [tab, setTab] = useState('pelanggaran')
  const [f, setF] = useState({ tahun_ajaran_id: '', semester: '', dari: '', sampai: '' })
  const [jenisData, setJenisData] = useState('semua')
  const [pel, setPel] = useState({ kategori: '', tingkat: '', status: '', search: '' })
  const [pre, setPre] = useState({ bidang: '', tingkat: '', jenis: '', search: '' })
  const [tl, setTl] = useState({ status: '', search: '' })
  const [loading, setLoading] = useState(false)
  const [sibuk, setSibuk] = useState('')
  const [versi, setVersi] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    api
      .rpOpsi()
      .then(setOpsi)
      .catch((e) => setError(e.message))
  }, [])

  const params = useMemo(
    () =>
      bersih({
        ...f, jenis_data: jenisData,
        pel_kategori: pel.kategori, pel_tingkat: pel.tingkat, pel_status: pel.status, pel_search: pel.search,
        pre_bidang: pre.bidang, pre_tingkat: pre.tingkat, pre_jenis: pre.jenis, pre_search: pre.search,
        tl_status: tl.status, tl_search: tl.search,
      }),
    [f, jenisData, pel, pre, tl],
  )
  const kunci = JSON.stringify(params)

  useEffect(() => {
    if (!siswa) return
    let batal = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const t = setTimeout(() => {
      api
        .rpProfil(siswa.id, params)
        .then((r) => !batal && (setProfil(r), setError('')))
        .catch((e) => !batal && setError(e.message))
        .finally(() => !batal && setLoading(false))
    }, 250)
    return () => {
      batal = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siswa, kunci, versi])

  const ubah = (pesan) => {
    setInfo(pesan)
    setVersi((v) => v + 1)
  }
  const pilih = (s) => {
    setSiswa(s)
    setProfil(null)
    setTab('pelanggaran')
    setPel({ kategori: '', tingkat: '', status: '', search: '' })
    setPre({ bidang: '', tingkat: '', jenis: '', search: '' })
    setTl({ status: '', search: '' })
    setInfo('')
  }
  async function ekspor(bagian, format) {
    setSibuk(format)
    setError('')
    try {
      await api.rpExport(siswa.id, { ...params, bagian }, format)
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk('')
    }
  }

  if (!opsi) return <div>{error ? <Pesan error={error} /> : <Kosong>Memuat…</Kosong>}</div>

  const label = 'text-[11px] font-semibold text-navy/50'
  const ta = opsi.tahun_ajaran.find((t) => String(t.id) === f.tahun_ajaran_id)

  return (
    <div>
      <div className="mb-5">
        {onBack && (
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-navy">Rekap Pembinaan</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">
          Gambaran pembinaan satu siswa dari data Pelanggaran, Prestasi, dan Tindak Lanjut Pembinaan. Data ini sensitif — {opsi.izin.lihat_semua ? 'akses dibatasi sesuai peran Anda.' : 'Anda hanya dapat melihat siswa di kelas binaan Anda.'}
        </p>
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="block">
            <span className={label}>Tahun Ajaran</span>
            <select value={f.tahun_ajaran_id} onChange={(e) => setF({ ...f, tahun_ajaran_id: e.target.value, semester: '' })} className={`${selectClass} w-full mt-1`}>
              <option value="">Semua periode</option>
              {opsi.tahun_ajaran.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Semester</span>
            <select value={f.semester} disabled={!ta} onChange={(e) => setF({ ...f, semester: e.target.value })} className={`${selectClass} w-full mt-1 disabled:opacity-50`}>
              <option value="">Setahun penuh</option>
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </label>
          <Field label="Periode dari">
            <input type="date" value={f.dari} onChange={(e) => setF({ ...f, dari: e.target.value })} className={`${selectClass} w-full`} />
          </Field>
          <Field label="Periode sampai">
            <input type="date" value={f.sampai} onChange={(e) => setF({ ...f, sampai: e.target.value })} className={`${selectClass} w-full`} />
          </Field>
        </div>
        <p className="text-[11px] text-navy/40 mt-2">Tanggal manual mengalahkan periode tahun ajaran/semester. Filter ini berlaku untuk semua bagian di bawah.</p>
      </div>

      <Pesan error={error} info={info} />

      {!siswa ? (
        <PemilihSiswaRekap opsi={opsi} filter={f} onPilih={pilih} />
      ) : !profil ? (
        <Kosong>{error ? '' : 'Memuat rekap pembinaan…'}</Kosong>
      ) : (
        <div className={`space-y-4 ${loading ? 'opacity-60 transition-opacity' : ''}`}>
          <IdentitasSiswa identitas={profil.identitas} onGanti={() => (setSiswa(null), setProfil(null))} />
          <RingkasanPembinaan r={profil.ringkasan} />

          <div className="flex gap-1 border-b border-navy/10 overflow-x-auto">
            {TABS.map(([key, l]) => (
              <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'pelanggaran' && (
            <TabPelanggaran data={profil.pelanggaran} pakaiPoin={profil.ringkasan.pakai_poin} opsi={opsi} kelola={profil.kelola} filter={pel} onFilter={(x) => setPel({ ...pel, ...x })} onExport={(fmt) => ekspor('pelanggaran', fmt)} sibuk={sibuk} onUbah={ubah} />
          )}
          {tab === 'prestasi' && <TabPrestasi data={profil.prestasi} opsi={opsi} filter={pre} onFilter={(x) => setPre({ ...pre, ...x })} onExport={(fmt) => ekspor('prestasi', fmt)} sibuk={sibuk} />}
          {tab === 'timeline' && <TimelinePembinaan items={profil.timeline} jenis={jenisData} onJenis={setJenisData} />}
          {tab === 'tindak-lanjut' && (
            <TabTindakLanjut data={profil.tindak_lanjut} pilihanPelanggaran={profil.pilihan_pelanggaran} opsi={opsi} siswaId={siswa.id} kelola={profil.kelola} filter={tl} onFilter={(x) => setTl({ ...tl, ...x })} onUbah={ubah} />
          )}
          {tab === 'analisis' && <AnalisisPembinaan a={profil.analisis} />}
          {tab === 'laporan' && <LaporanPembinaan siswaId={siswa.id} params={params} />}
        </div>
      )}
    </div>
  )
}
