import { useCallback, useEffect, useState } from 'react'
import PpdbAuditTab from '../components/PpdbAuditTab'
import { DaftarNotifikasi, LoncengNotifikasi } from '../components/PpdbNotifikasi'
import PpdbDaftarUlangTab from '../components/PpdbDaftarUlangTab'
import PpdbDashboardTab from '../components/PpdbDashboardTab'
import PpdbPendaftaranTab from '../components/PpdbPendaftaranTab'
import PpdbPengaturanTab from '../components/PpdbPengaturanTab'
import PpdbPengumumanTab from '../components/PpdbPengumumanTab'
import PpdbPenerimaanTab from '../components/PpdbPenerimaanTab'
import PpdbSeleksiTab from '../components/PpdbSeleksiTab'
import { Kosong, Pesan } from '../components/PpdbUI'
import { STATUS_PERIODE_TONE, selectClass } from '../components/ppdbKonstanta'
import { api } from '../lib/api'

const TABS = [
  ['dashboard', 'Dashboard'],
  ['pengaturan', 'Pengaturan'],
  ['pendaftaran', 'Pendaftaran'],
  ['verifikasi', 'Verifikasi & Validasi'],
  ['seleksi', 'Seleksi'],
  ['pengumuman', 'Pengumuman'],
  ['daftar-ulang', 'Daftar Ulang'],
  ['diterima', 'Peserta Diterima'],
  ['audit', 'Audit Trail'],
]

export default function PpdbManagement({ onBack }) {
  const [daftar, setDaftar] = useState(null)
  const [periodeId, setPeriodeId] = useState(null)
  const [periode, setPeriode] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [baru, setBaru] = useState(false)
  const [error, setError] = useState('')
  const [versi, setVersi] = useState(0)
  const [notif, setNotif] = useState(null)

  const muatDaftar = useCallback(
    (pilih) =>
      api
        .ppdbListPeriode()
        .then((r) => {
          setDaftar(r)
          setPeriodeId((sekarang) => pilih ?? (r.some((p) => p.id === sekarang) ? sekarang : (r.find((p) => p.status !== 'selesai') ?? r[0])?.id ?? null))
        })
        .catch((e) => setError(e.message)),
    [],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muatDaftar()
  }, [muatDaftar])

  const muatPeriode = useCallback(() => {
    if (!periodeId) {
      setPeriode(null)
      return Promise.resolve()
    }
    return api
      .ppdbGetPeriode(periodeId)
      .then(setPeriode)
      .catch((e) => setError(e.message))
  }, [periodeId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muatPeriode()
  }, [muatPeriode, versi])

  useEffect(() => {
    if (!periodeId) return
    let batal = false
    api
      .ppdbNotifikasi(periodeId)
      .then((r) => !batal && setNotif(r))
      .catch(() => {})
    return () => {
      batal = true
    }
  }, [periodeId, versi])

  // Perubahan data di tab mana pun menyegarkan konfigurasi periode dan daftar.
  const berubah = useCallback(() => {
    setVersi((v) => v + 1)
    muatDaftar()
  }, [muatDaftar])

  if (!daftar) return <Kosong>{error || 'Memuat PPDB…'}</Kosong>

  const tanpaPeriode = daftar.length === 0
  const tabAktif = tanpaPeriode ? 'pengaturan' : tab
  const siap = periode && String(periode.id) === String(periodeId)

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">PPDB</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">Penerimaan peserta didik baru: dari pengaturan, pendaftaran, verifikasi, seleksi, pengumuman, daftar ulang, sampai menjadi Data Siswa.</p>
      </div>

      {!tanpaPeriode && (
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <select
            value={periodeId ?? ''}
            onChange={(e) => {
              setPeriodeId(Number(e.target.value))
              setBaru(false)
            }}
            className={selectClass}
          >
            {daftar.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} — TA {p.tahun_ajaran}
              </option>
            ))}
          </select>
          {siap && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_PERIODE_TONE[periode.status]}`}>{periode.status_label}</span>}
          <LoncengNotifikasi data={notif} onBuka={(t) => setTab(t)} />
        </div>
      )}

      <div className="flex gap-1 border-b border-navy/10 mb-4 overflow-x-auto">
        {TABS.map(([key, label]) => {
          const nonaktif = tanpaPeriode && key !== 'pengaturan'
          return (
            <button
              key={key}
              disabled={nonaktif}
              onClick={() => {
                setTab(key)
                if (key !== 'pengaturan') setBaru(false)
              }}
              className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap disabled:opacity-30 ${tabAktif === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}
            >
              {label}
              {notif?.per_tab?.[key] > 0 && <span className="ml-1.5 inline-flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">{notif.per_tab[key]}</span>}
            </button>
          )
        })}
      </div>

      <Pesan error={error} />

      {tabAktif === 'pengaturan' && (
        <PpdbPengaturanTab
          key={baru ? 'baru' : periodeId}
          periodeId={periodeId}
          mulaiBaru={baru || tanpaPeriode}
          onDibuat={(id) => {
            setBaru(false)
            muatDaftar(id)
          }}
          onBerubah={berubah}
          onDihapus={() => muatDaftar()}
        />
      )}
      {tabAktif !== 'pengaturan' && !siap && <Kosong>Memuat…</Kosong>}
      {tabAktif !== 'pengaturan' && siap && (
        <>
          {tabAktif === 'dashboard' && (
            <>
              {notif && notif.data.length > 0 && (
                <section className="bg-white rounded-2xl border border-navy/5 shadow-sm p-5 mb-4">
                  <h3 className="text-sm font-bold text-navy mb-3">Notifikasi</h3>
                  <DaftarNotifikasi data={notif} onBuka={setTab} />
                </section>
              )}
              <PpdbDashboardTab key={`${periode.id}-${versi}`} periodeId={periode.id} onBuka={setTab} />
            </>
          )}
          {tabAktif === 'pendaftaran' && <PpdbPendaftaranTab key={periode.id} periode={periode} onBerubah={berubah} />}
          {tabAktif === 'verifikasi' && <PpdbPendaftaranTab key={`v${periode.id}`} mode="verifikasi" periode={periode} onBerubah={berubah} />}
          {tabAktif === 'seleksi' && <PpdbSeleksiTab key={periode.id} periode={periode} onBerubah={berubah} />}
          {tabAktif === 'pengumuman' && <PpdbPengumumanTab key={periode.id} periode={periode} onBerubah={berubah} />}
          {tabAktif === 'daftar-ulang' && <PpdbDaftarUlangTab key={periode.id} periode={periode} onBerubah={berubah} />}
          {tabAktif === 'diterima' && <PpdbPenerimaanTab key={periode.id} periode={periode} onBerubah={berubah} />}
          {tabAktif === 'audit' && <PpdbAuditTab key={`${periode.id}-${versi}`} periode={periode} />}
        </>
      )}
    </div>
  )
}
