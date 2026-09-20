import { useEffect, useState } from 'react'
import KalenderPrint from '../components/KalenderPrint'
import { AgendaView, MonthView, WeekView } from '../components/KalenderViews'
import { DuplikasiKalenderModal, KegiatanDetailModal, KegiatanFormModal } from '../components/KegiatanKalenderModals'
import { KATEGORI_LABEL, KATEGORI_STYLE, STATUS_KEGIATAN, awalMinggu, fromIso, namaBulan, toIso } from '../components/kalenderKonstanta'
import { api } from '../lib/api'

const TABS = [
  ['kalender', 'Kalender'],
  ['periode', 'Periode & Hari Efektif'],
  ['pengaturan', 'Pengaturan'],
  ['riwayat', 'Riwayat'],
]
const VIEWS = [
  ['bulan', 'Bulanan'],
  ['minggu', 'Mingguan'],
  ['agenda', 'Daftar Agenda'],
]
const STATUS_KALENDER = { draft: 'Draft', aktif: 'Aktif', arsip: 'Arsip' }
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'
const EVENT_LABEL = { created: 'Dibuat', updated: 'Diperbarui', deleted: 'Dihapus', lampiran: 'Lampiran', status: 'Status Kalender', duplicated: 'Duplikasi' }

export default function KalenderAkademikManagement({ onBack, onNavigate }) {
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], guru: [] })
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [tab, setTab] = useState('kalender')
  const [view, setView] = useState('bulan')
  const [cursor, setCursor] = useState(new Date())

  const [data, setData] = useState(null)
  const [pengaturan, setPengaturan] = useState(null)
  const [pengingat, setPengingat] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [kategoriAktif, setKategoriAktif] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    api
      .getOpsiKalender()
      .then((o) => {
        setOpsi(o)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        if (aktif) {
          setTahunAjaranId(String(aktif.id))
          const awal = fromIso(aktif.tanggal_mulai.slice(0, 10))
          const akhir = fromIso(aktif.tanggal_selesai.slice(0, 10))
          const sekarang = new Date()
          setCursor(sekarang >= awal && sekarang <= akhir ? sekarang : awal)
        }
      })
      .catch((err) => setError(err.message))
    api
      .getPengingatKalender()
      .then((r) => setPengingat(r.akan_datang))
      .catch(() => {})
  }, [])

  function muat() {
    if (!tahunAjaranId) return
    api
      .getEntriKalender({ tahun_ajaran_id: tahunAjaranId })
      .then(setData)
      .catch((err) => setError(err.message))
    api
      .getPengaturanKalender(tahunAjaranId)
      .then(setPengaturan)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    muat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaranId])

  function ubahTahun(id) {
    setTahunAjaranId(id)
    setData(null)
    setPengaturan(null)
    setNotice('')
    setError('')
    const t = opsi.tahun_ajaran.find((x) => String(x.id) === id)
    if (t) setCursor(fromIso(t.tanggal_mulai.slice(0, 10)))
  }

  const ta = opsi.tahun_ajaran.find((t) => String(t.id) === tahunAjaranId)
  const cari = search.trim().toLowerCase()
  const entri = (data?.entri ?? []).filter(
    (e) =>
      (kategoriAktif.length === 0 || kategoriAktif.includes(e.kategori)) &&
      (!statusFilter || e.status === statusFilter) &&
      (!cari || [e.judul, e.lokasi, e.penanggung_jawab, e.peserta, e.keterangan].some((v) => v && v.toLowerCase().includes(cari))),
  )

  function geser(arah) {
    setCursor((c) => {
      const d = new Date(c)
      if (view === 'minggu') d.setDate(d.getDate() + 7 * arah)
      else d.setMonth(d.getMonth() + arah, 1)
      return d
    })
  }

  function bukaEntri(e) {
    setModal({ tipe: 'detail', entri: e })
  }

  async function hapus(e) {
    if (!window.confirm(`Hapus agenda "${e.judul}"?`)) return
    try {
      await api.deleteKegiatanKalender(e.id)
      setModal(null)
      setNotice('Agenda dihapus.')
      muat()
    } catch (err) {
      setError(err.message)
    }
  }

  const minggu = awalMinggu(cursor)
  const akhirMinggu = new Date(minggu)
  akhirMinggu.setDate(minggu.getDate() + 6)
  const judulPeriode =
    view === 'minggu'
      ? `${minggu.getDate()} ${namaBulan(minggu.getMonth())} – ${akhirMinggu.getDate()} ${namaBulan(akhirMinggu.getMonth())} ${akhirMinggu.getFullYear()}`
      : `${namaBulan(cursor.getMonth())} ${cursor.getFullYear()}`

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Kalender Akademik</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">
          Agenda kegiatan sekolah dalam satu tahun ajaran. Hari efektif dan hari libur dibaca dari menu Hari Efektif — tidak diinput ulang di sini.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <select value={tahunAjaranId} onChange={(e) => ubahTahun(e.target.value)} className={selectClass}>
          {opsi.tahun_ajaran.length === 0 && <option value="">Belum ada tahun ajaran</option>}
          {opsi.tahun_ajaran.map((t) => (
            <option key={t.id} value={t.id}>
              Tahun Ajaran {t.nama}
            </option>
          ))}
        </select>
        {pengaturan && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pengaturan.kalender.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : pengaturan.kalender.status === 'arsip' ? 'bg-navy/10 text-navy/50' : 'bg-amber-100 text-amber-700'}`}>
            Kalender {pengaturan.kalender.status_label}
          </span>
        )}
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {notice && <p className="text-emerald-700 text-sm mb-3">{notice}</p>}
      {!ta && <p className="text-sm text-navy/40 text-center py-10">Tambahkan Tahun Ajaran terlebih dahulu.</p>}

      {ta && tab === 'kalender' && (
        <>
          {pengingat.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
              <p className="text-xs font-bold text-amber-900 mb-1.5">Agenda 14 hari ke depan</p>
              <ul className="space-y-0.5">
                {pengingat.slice(0, 5).map((a) => (
                  <li key={a.key} className="text-xs text-amber-900">
                    <b>{a.hari_lagi === 0 ? 'Hari ini' : `${a.hari_lagi} hari lagi`}</b> — {a.judul} ({a.tanggal_mulai})
                    {a.dalam_jendela_pengingat && <span className="ml-1 text-[10px] font-semibold bg-amber-200 rounded px-1">pengingat aktif</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap mb-3">
            <div className="flex border border-navy/15 rounded-lg overflow-hidden">
              {VIEWS.map(([k, l]) => (
                <button key={k} onClick={() => setView(k)} className={`px-3 py-2 text-xs font-semibold ${view === k ? 'bg-navy text-white' : 'text-navy hover:bg-navy/5'}`}>
                  {l}
                </button>
              ))}
            </div>
            {view !== 'agenda' && (
              <>
                <Btn onClick={() => geser(-1)}>‹</Btn>
                <span className="text-sm font-bold text-navy min-w-40 text-center">{judulPeriode}</span>
                <Btn onClick={() => geser(1)}>›</Btn>
                <Btn onClick={() => setCursor(new Date())}>Hari ini</Btn>
              </>
            )}
            <span className="flex-1" />
            <Btn primary onClick={() => setModal({ tipe: 'form', item: null, tanggal: toIso(new Date()) })}>
              + Tambah Agenda
            </Btn>
            <Btn onClick={() => api.exportKalender(tahunAjaranId).catch((e) => setError(e.message))}>Excel</Btn>
            <Btn onClick={() => api.pdfKalender(tahunAjaranId).catch((e) => setError(e.message))}>PDF</Btn>
            <Btn onClick={() => setModal({ tipe: 'cetak' })}>Cetak</Btn>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-3">
            {Object.keys(KATEGORI_LABEL).map((k) => {
              const aktif = kategoriAktif.includes(k)
              return (
                <button
                  key={k}
                  onClick={() => setKategoriAktif((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${aktif ? 'border-navy bg-navy/5 text-navy' : 'border-navy/15 text-navy/60'}`}
                  title="Klik untuk memfilter kategori"
                >
                  <span className={`w-2 h-2 rounded-full ${KATEGORI_STYLE[k].dot}`} />
                  {KATEGORI_LABEL[k]}
                </button>
              )
            })}
            {kategoriAktif.length > 0 && (
              <button onClick={() => setKategoriAktif([])} className="text-[11px] text-navy/50 underline">
                reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Status Kegiatan</option>
              {Object.entries(STATUS_KEGIATAN).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kegiatan, lokasi, penanggung jawab…" className={`${selectClass} w-72`} />
            <span className="text-[11px] text-navy/40">Garis putus-putus = entri dari Hari Efektif / periode (baca-saja).</span>
          </div>

          {!data ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : view === 'bulan' ? (
            <MonthView tahun={cursor.getFullYear()} bulan={cursor.getMonth()} entri={entri} hariEfektif={data.hari_efektif} onEntri={bukaEntri} onTanggal={(iso) => setModal({ tipe: 'form', item: null, tanggal: iso })} />
          ) : view === 'minggu' ? (
            <WeekView awal={minggu} entri={entri} hariEfektif={data.hari_efektif} onEntri={bukaEntri} onTanggal={(iso) => setModal({ tipe: 'form', item: null, tanggal: iso })} />
          ) : (
            <AgendaView entri={entri} onEntri={bukaEntri} />
          )}
        </>
      )}

      {ta && tab === 'periode' && <PeriodeTab ta={pengaturan?.tahun_ajaran} semester={pengaturan?.semester} entri={data?.entri ?? []} onNavigate={onNavigate} />}

      {ta && tab === 'pengaturan' && pengaturan && (
        <PengaturanTab
          pengaturan={pengaturan}
          onSaved={(pesan) => {
            setNotice(pesan)
            muat()
          }}
          onError={setError}
          onDuplikasi={() => setModal({ tipe: 'duplikasi' })}
          onNavigate={onNavigate}
        />
      )}

      {ta && tab === 'riwayat' && <RiwayatTab tahunAjaranId={tahunAjaranId} refreshKey={data} />}

      {modal?.tipe === 'form' && (
        <KegiatanFormModal
          item={modal.item}
          tahunAjaranId={Number(tahunAjaranId)}
          tanggalAwal={modal.tanggal}
          guru={opsi.guru}
          onClose={() => {
            setModal(null)
            muat()
          }}
          onSaved={muat}
        />
      )}
      {modal?.tipe === 'detail' && (
        <KegiatanDetailModal
          entri={modal.entri}
          onClose={() => setModal(null)}
          onNavigate={(v) => {
            setModal(null)
            onNavigate(v)
          }}
          onEdit={(d) => setModal({ tipe: 'form', item: d })}
          onHapus={hapus}
        />
      )}
      {modal?.tipe === 'duplikasi' && <DuplikasiKalenderModal tahunAjaran={opsi.tahun_ajaran} tujuanId={Number(tahunAjaranId)} onClose={() => setModal(null)} onSaved={muat} />}
      {modal?.tipe === 'cetak' && ta && <KalenderPrint tahunAjaran={ta} entri={entri} pengaturan={pengaturan} onClose={() => setModal(null)} />}
    </div>
  )
}

function PeriodeTab({ ta, semester, entri, onNavigate }) {
  if (!ta) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  const libur = entri.filter((e) => e.sumber === 'hari_efektif' && e.kategori === 'libur')

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Kartu label="Awal Tahun Ajaran" nilai={ta.awal} />
        <Kartu label="Akhir Tahun Ajaran" nilai={ta.akhir} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {semester.map((s) => (
          <div key={s.semester} className="bg-white border border-navy/10 rounded-2xl p-4">
            <p className="text-sm font-bold text-navy capitalize mb-2">Semester {s.semester}</p>
            {!s.terdaftar ? (
              <p className="text-xs text-amber-700">Semester ini belum terdaftar pada data Semester tahun ajaran ini.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Kartu label="Awal Semester" nilai={s.awal} kecil />
                <Kartu label="Akhir Semester" nilai={s.akhir} kecil />
              </div>
            )}
            {s.hari_efektif ? (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <Kartu label="Hari Efektif" nilai={s.hari_efektif.hari_efektif} kecil />
                  <Kartu label="Hari Libur" nilai={s.hari_efektif.libur} kecil />
                  <Kartu label="Minggu Efektif" nilai={s.hari_efektif.minggu_efektif} kecil />
                  <Kartu label="Hari Sekolah/Mgg" nilai={s.hari_efektif.hari_sekolah} kecil />
                </div>
                <p className="text-[11px] text-navy/40 mt-2">
                  Setara {s.hari_efektif.setara_minggu} minggu penuh · status Hari Efektif: {s.hari_efektif.status}. Data ini dibaca dari menu Hari Efektif.
                </p>
              </>
            ) : (
              <p className="text-xs text-navy/50">Hari efektif semester ini belum disusun.</p>
            )}
            <button onClick={() => onNavigate('hari-efektif')} className="mt-3 text-xs font-semibold text-navy underline">
              Kelola di Hari Efektif →
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl p-4">
        <p className="text-sm font-bold text-navy mb-2">Hari Libur ({libur.length})</p>
        {libur.length === 0 ? (
          <p className="text-xs text-navy/40">Belum ada hari libur non-akhir pekan yang ditandai di Hari Efektif.</p>
        ) : (
          <ul className="text-xs text-navy/70 space-y-0.5">
            {libur.map((e) => (
              <li key={e.key}>
                {e.tanggal_mulai}
                {e.tanggal_selesai !== e.tanggal_mulai ? ` s.d. ${e.tanggal_selesai}` : ''} — {e.judul}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function PengaturanTab({ pengaturan, onSaved, onError, onDuplikasi, onNavigate }) {
  const [status, setStatus] = useState(pengaturan.kalender.status)
  const [catatan, setCatatan] = useState(pengaturan.kalender.catatan ?? '')
  const [saving, setSaving] = useState(false)

  async function simpan(e) {
    e.preventDefault()
    if (status === 'aktif' && pengaturan.kalender.status !== 'aktif' && !window.confirm('Menjadikan kalender ini Aktif akan mengarsipkan kalender aktif lainnya. Lanjutkan?')) return
    setSaving(true)
    onError('')
    try {
      const res = await api.updatePengaturanKalender({ tahun_ajaran_id: pengaturan.tahun_ajaran.id, status, catatan: catatan || null })
      onSaved(res.message)
    } catch (err) {
      onError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const hariSekolah = pengaturan.semester.map((s) => s.hari_efektif?.hari_sekolah).filter(Boolean)

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <form onSubmit={simpan} className="bg-white border border-navy/10 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold text-navy">Status Kalender</p>
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            {Object.entries(STATUS_KALENDER).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <span className="block text-[11px] text-navy/40 mt-1">Hanya satu kalender yang Aktif (kalender berjalan); yang aktif sebelumnya otomatis diarsipkan.</span>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Catatan</span>
          <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} maxLength={2000} className="input min-h-20" />
        </label>
        <button type="submit" disabled={saving} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>

      <div className="space-y-4">
        <div className="bg-white border border-navy/10 rounded-2xl p-4 text-sm text-navy/70 space-y-1">
          <p className="text-sm font-bold text-navy mb-1">Tahun Ajaran & Semester</p>
          <p>
            Tahun Ajaran <b>{pengaturan.tahun_ajaran.nama}</b>: {pengaturan.tahun_ajaran.awal} s.d. {pengaturan.tahun_ajaran.akhir}
          </p>
          {pengaturan.semester.map((s) => (
            <p key={s.semester} className="capitalize">
              Semester {s.semester}: {s.terdaftar ? `${s.awal} s.d. ${s.akhir}` : 'belum terdaftar'}
            </p>
          ))}
          <p className="text-[11px] text-navy/40 pt-1">Tanggal tahun ajaran dan semester dikelola di pengaturan akademik sekolah, bukan di kalender.</p>
          <p className="pt-1">
            Hari sekolah: <b>{hariSekolah.length ? [...new Set(hariSekolah)].join(' / ') + ' hari per minggu' : 'belum diatur'}</b>{' '}
            <button type="button" onClick={() => onNavigate('hari-efektif')} className="text-xs font-semibold text-navy underline">
              atur di Hari Efektif
            </button>
          </p>
        </div>

        <div className="bg-white border border-navy/10 rounded-2xl p-4">
          <p className="text-sm font-bold text-navy mb-1">Duplikasi Kalender</p>
          <p className="text-xs text-navy/50 mb-3">Salin agenda dari tahun ajaran sebelumnya ke tahun ajaran ini. Hari Efektif tidak ikut disalin.</p>
          <button type="button" onClick={onDuplikasi} className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-4 py-2 hover:bg-navy hover:text-white">
            Duplikasi dari Tahun Sebelumnya
          </button>
        </div>
      </div>
    </div>
  )
}

function RiwayatTab({ tahunAjaranId, refreshKey }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRiwayatKalender(tahunAjaranId)
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [tahunAjaranId, refreshKey])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!items) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  if (items.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Belum ada riwayat perubahan.</p>

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} className="border border-navy/10 rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-navy">{EVENT_LABEL[r.event] || r.event}</span>
            <span className="text-[11px] text-navy/40">{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <p className="text-xs text-navy/60">{r.description}</p>
          <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
        </div>
      ))}
    </div>
  )
}

function Kartu({ label, nilai, kecil }) {
  return (
    <div className="bg-navy/5 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className={`${kecil ? 'text-sm' : 'text-lg'} font-extrabold text-navy`}>{nilai ?? '-'}</p>
    </div>
  )
}

function Btn({ primary, children, ...props }) {
  return (
    <button
      {...props}
      className={`text-xs font-semibold rounded-md px-3.5 py-2 border transition-colors disabled:opacity-40 ${primary ? 'bg-navy text-white border-navy hover:bg-navy-light' : 'text-navy border-navy/20 hover:bg-navy hover:text-white'}`}
    >
      {children}
    </button>
  )
}
