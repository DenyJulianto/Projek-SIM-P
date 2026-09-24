import { useEffect, useState } from 'react'
import Pager from '../../components/Pager'
import { api, BASE_URL } from '../../lib/api'
import { downloadCsv } from '../../lib/exportCsv'

const PAGE_SIZE = 10

const JENIS_LABEL = {
  rekrutmen: 'Rekrutmen',
  promosi: 'Promosi',
  mutasi: 'Mutasi',
  pemberhentian: 'Pemberhentian',
  lainnya: 'Lainnya',
}

const STATUS_PILL = {
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-rose-100 text-rose-600',
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-rose-100 text-rose-600',
}

const AVATAR_COLORS = ['bg-emerald-700', 'bg-teal-600', 'bg-emerald-600', 'bg-lime-600', 'bg-teal-700']

export default function KepegawaianKepsekView({ tab }) {
  return (
    <div>
      {(tab === 'guru' || tab === 'pegawai') && <DaftarPegawai tab={tab} />}
      {tab === 'pengajuan' && <PengajuanList />}
      {tab === 'persetujuan' && <PersetujuanList />}
    </div>
  )
}

/* ---------- kerangka bersama: judul + tombol + tabel ---------- */

function Frame({ title, subtitle, info, onExport, exportDisabled, filterOpen, onToggleFilter, filters, children }) {
  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold text-navy mr-2">{title}</h1>
          <button
            onClick={onExport}
            disabled={exportDisabled}
            className="bg-white border border-emerald-200 text-navy-light hover:bg-emerald-50 text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-40"
          >
            Ekspor (CSV)
          </button>
        </div>
        <div className="flex items-center gap-4">
          {info && <div className="text-right text-xs text-navy/60 leading-relaxed">{info}</div>}
          <button
            onClick={onToggleFilter}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-md transition-colors"
          >
            <span className={`inline-block transition-transform ${filterOpen ? 'rotate-90' : ''}`}>‹</span>
            Filter
          </button>
        </div>
      </div>
      {subtitle && <p className="text-sm text-navy/50 -mt-3 mb-4">{subtitle}</p>}

      {filterOpen && <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-4">{filters}</div>}

      {children}
    </div>
  )
}

function FilterInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-white border border-emerald-100 rounded-lg px-4 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
    />
  )
}

function FilterSelectBox({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="bg-white border border-emerald-100 rounded-lg px-4 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
    >
      {children}
    </select>
  )
}

function MembersTable({ columns, rows, page, onPage, emptyText, loading }) {
  const lastPage = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1)
  const current = Math.min(page, lastPage)
  const from = (current - 1) * PAGE_SIZE
  const visible = rows.slice(from, from + PAGE_SIZE)

  return (
    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs font-semibold uppercase tracking-wide text-left">
              {columns.map((c) => (
                <th key={c.label} className={`px-5 py-4 ${c.center ? 'text-center' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-navy/40">
                  {emptyText}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id} className="border-t border-emerald-100 odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                  {columns.map((c) => (
                    <td key={c.label} className={`px-5 py-3 ${c.center ? 'text-center' : ''}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
        <span>{rows.length > 0 ? `Menampilkan ${from + 1}–${from + visible.length} dari ${rows.length} data` : 'Tidak ada data'}</span>
        {lastPage > 1 && <Pager current={current} last={lastPage} onChange={onPage} />}
      </div>
    </div>
  )
}

function Avatar({ nama, src }) {
  const inisial = (nama || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return src ? (
    <img src={`${BASE_URL}${src}`} alt={nama} className="h-11 w-11 rounded-xl object-cover" />
  ) : (
    <span
      className={`h-11 w-11 rounded-xl text-white text-sm font-bold flex items-center justify-center ${AVATAR_COLORS[(nama || '').length % AVATAR_COLORS.length]}`}
    >
      {inisial}
    </span>
  )
}

function Pill({ status, label }) {
  return (
    <span className={`inline-block text-xs font-semibold px-4 py-1 rounded-full capitalize ${STATUS_PILL[status] || 'bg-slate-100 text-slate-600'}`}>
      {label || status}
    </span>
  )
}

function IconButton({ title, onClick, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
    >
      {children}
    </button>
  )
}

function ActionButton({ onClick, children, tone = 'primary', disabled }) {
  const style =
    tone === 'primary'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-colors disabled:opacity-50 ${style}`}
    >
      {children}
    </button>
  )
}

/* ---------- Data Guru / Data Pegawai ---------- */

function DaftarPegawai({ tab }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api.getPrincipalKepegawaian().then(setData).catch((err) => setError(err.message))
  }, [])

  const semua = data?.daftar || []
  const rows = semua
    .filter((g) => !status || g.status === status)
    .filter((g) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return [g.nama, g.nip, g.jabatan, g.email].some((v) => (v || '').toLowerCase().includes(q))
    })

  function exportCsv() {
    downloadCsv(
      tab === 'guru' ? 'data-guru.csv' : 'data-pegawai.csv',
      ['No', 'Nama', 'NIP', 'Jabatan', 'Telepon', 'Email', 'Status'],
      rows.map((g, i) => [i + 1, g.nama, g.nip, g.jabatan, g.no_telepon, g.email, g.status])
    )
  }

  const columns = [
    { label: 'Foto', render: (g) => <Avatar nama={g.nama} src={g.avatar_url} /> },
    {
      label: 'Nama',
      render: (g) => (
        <div>
          <p className="font-semibold text-navy whitespace-nowrap">{[g.nama, g.gelar].filter(Boolean).join(', ')}</p>
          <p className="text-[11px] text-navy/50">NIP {g.nip || '-'}</p>
        </div>
      ),
    },
    { label: 'Jabatan', render: (g) => <span className="text-navy/70">{g.jabatan || '-'}</span> },
    { label: 'Telepon', render: (g) => <span className="text-navy/70 whitespace-nowrap">{g.no_telepon || '-'}</span> },
    { label: 'Email', render: (g) => <span className="text-navy/70">{g.email || '-'}</span> },
    { label: 'Status', render: (g) => <Pill status={g.status} /> },
    {
      label: 'Aksi',
      center: true,
      render: (g) => (
        <div className="flex items-center justify-center gap-2">
          <IconButton title="Lihat detail" onClick={() => setDetail(g)}>
            <EyeIcon className="h-5 w-5" />
          </IconButton>
          <ActionButton onClick={() => setDetail(g)}>Detail</ActionButton>
        </div>
      ),
    },
  ]

  return (
    <Frame
      title={tab === 'guru' ? 'Data Guru' : 'Data Pegawai'}
      subtitle={
        tab === 'pegawai'
          ? 'Sistem belum memisahkan pegawai non-guru dari data guru — seluruh data kepegawaian yang tercatat ditampilkan di sini. Tampilan baca saja.'
          : 'Tampilan baca saja — pengelolaan data dilakukan oleh Tata Usaha.'
      }
      info={
        data && (
          <>
            <p>Total pegawai: {data.total}</p>
            <p>Aktif: {data.aktif} · Nonaktif: {data.nonaktif}</p>
          </>
        )
      }
      onExport={exportCsv}
      exportDisabled={rows.length === 0}
      filterOpen={filterOpen}
      onToggleFilter={() => setFilterOpen((v) => !v)}
      filters={
        <>
          <FilterInput
            value={cari}
            onChange={(e) => {
              setCari(e.target.value)
              setPage(1)
            }}
            placeholder="Cari nama, NIP, jabatan, atau email..."
          />
          <FilterSelectBox
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </FilterSelectBox>
        </>
      }
    >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <MembersTable
        columns={columns}
        rows={rows}
        page={page}
        onPage={setPage}
        loading={!data && !error}
        emptyText={semua.length === 0 ? 'Belum ada data.' : 'Tidak ada data yang cocok.'}
      />
      {detail && <DetailModal guru={detail} onClose={() => setDetail(null)} />}
    </Frame>
  )
}

function DetailModal({ guru, onClose }) {
  const rows = [
    ['NIP', guru.nip],
    ['NUPTK', guru.nuptk],
    ['Jabatan', guru.jabatan],
    ['Mata Pelajaran', guru.mata_pelajaran],
    ['Status Kepegawaian', guru.status_kepegawaian],
    ['Pendidikan Terakhir', guru.pendidikan_terakhir],
    ['Mulai Mengajar', guru.tahun_mulai_mengajar],
    ['Telepon', guru.no_telepon],
    ['Email', guru.email],
  ]

  return (
    <div className="fixed inset-0 z-50 bg-emerald-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-white via-emerald-50 to-teal-100 border border-white rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-emerald-900/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <Avatar nama={guru.nama} src={guru.avatar_url} />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-navy truncate">{[guru.nama, guru.gelar].filter(Boolean).join(', ')}</p>
            <Pill status={guru.status} />
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/80 hover:bg-white border border-emerald-200 text-emerald-800 font-bold leading-none" aria-label="Tutup">
            &times;
          </button>
        </div>
        <dl className="bg-white/70 rounded-2xl divide-y divide-emerald-100 px-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
              <dt className="text-navy/50">{label}</dt>
              <dd className="font-semibold text-navy text-right">{value || '-'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

/* ---------- Pengajuan & Persetujuan ---------- */

function usePengajuan(params) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api.listPengajuanKepegawaian(params).then(setData).catch((err) => setError(err.message))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  return [data, error, load]
}

function PengajuanList() {
  const [data, error] = usePengajuan({})
  const [filterOpen, setFilterOpen] = useState(false)
  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const semua = data || []
  const rows = semua
    .filter((p) => !status || p.status === status)
    .filter((p) => !cari.trim() || `${p.judul} ${p.diajukan_oleh?.name || ''}`.toLowerCase().includes(cari.toLowerCase()))

  const columns = [
    { label: 'Pengaju', render: (p) => <Avatar nama={p.diajukan_oleh?.name} src={null} /> },
    {
      label: 'Judul',
      render: (p) => (
        <div>
          <p className="font-semibold text-navy">{p.judul}</p>
          <p className="text-[11px] text-navy/50">oleh {p.diajukan_oleh?.name || '-'}</p>
        </div>
      ),
    },
    { label: 'Jenis', render: (p) => <span className="text-navy/70">{JENIS_LABEL[p.jenis] || p.jenis}</span> },
    { label: 'Terkait', render: (p) => <span className="text-navy/70">{p.guru?.nama || '-'}</span> },
    { label: 'Status', render: (p) => <Pill status={p.status} /> },
  ]

  return (
    <Frame
      title="Pengajuan Kepegawaian"
      subtitle="Alur pengajuan kepegawaian dari Tata Usaha dan bidang terkait."
      info={data && <p>Total pengajuan: {semua.length}</p>}
      onExport={() =>
        downloadCsv(
          'pengajuan-kepegawaian.csv',
          ['No', 'Judul', 'Jenis', 'Diajukan Oleh', 'Terkait', 'Status'],
          rows.map((p, i) => [i + 1, p.judul, JENIS_LABEL[p.jenis], p.diajukan_oleh?.name, p.guru?.nama, p.status])
        )
      }
      exportDisabled={rows.length === 0}
      filterOpen={filterOpen}
      onToggleFilter={() => setFilterOpen((v) => !v)}
      filters={
        <>
          <FilterInput value={cari} onChange={(e) => { setCari(e.target.value); setPage(1) }} placeholder="Cari judul atau pengaju..." />
          <FilterSelectBox value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Semua Status</option>
            <option value="diajukan">Diajukan</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </FilterSelectBox>
        </>
      }
    >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <MembersTable
        columns={columns}
        rows={rows}
        page={page}
        onPage={setPage}
        loading={!data && !error}
        emptyText={semua.length === 0 ? 'Belum ada pengajuan kepegawaian.' : 'Tidak ada data yang cocok.'}
      />
    </Frame>
  )
}

function PersetujuanList() {
  const [data, error, load] = usePengajuan({ status: 'diajukan' })
  const [busyId, setBusyId] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [cari, setCari] = useState('')
  const [page, setPage] = useState(1)

  async function handleApprove(item) {
    const catatan = window.prompt(`Catatan persetujuan untuk "${item.judul}" (opsional):`, '')
    if (catatan === null) return
    setBusyId(item.id)
    try {
      await api.approvePengajuanKepegawaian(item.id, { catatan_persetujuan: catatan || undefined })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(item) {
    const catatan = window.prompt(`Alasan penolakan untuk "${item.judul}" (wajib diisi):`, '')
    if (!catatan) return
    setBusyId(item.id)
    try {
      await api.rejectPengajuanKepegawaian(item.id, { catatan_persetujuan: catatan })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const semua = data || []
  const rows = semua.filter((p) => !cari.trim() || `${p.judul} ${p.diajukan_oleh?.name || ''}`.toLowerCase().includes(cari.toLowerCase()))

  const columns = [
    { label: 'Pengaju', render: (p) => <Avatar nama={p.diajukan_oleh?.name} src={null} /> },
    {
      label: 'Pengajuan',
      render: (p) => (
        <div>
          <p className="font-semibold text-navy">{p.judul}</p>
          <p className="text-[11px] text-navy/50">
            oleh {p.diajukan_oleh?.name || '-'}
            {p.keterangan ? ` · ${p.keterangan}` : ''}
          </p>
        </div>
      ),
    },
    { label: 'Jenis', render: (p) => <span className="text-navy/70">{JENIS_LABEL[p.jenis] || p.jenis}</span> },
    { label: 'Terkait', render: (p) => <span className="text-navy/70">{p.guru?.nama || '-'}</span> },
    { label: 'Status', render: (p) => <Pill status={p.status} /> },
    {
      label: 'Aksi',
      center: true,
      render: (p) => (
        <div className="flex items-center justify-center gap-2">
          <ActionButton tone="danger" onClick={() => handleReject(p)} disabled={busyId === p.id}>
            Tolak
          </ActionButton>
          <ActionButton onClick={() => handleApprove(p)} disabled={busyId === p.id}>
            Setujui
          </ActionButton>
        </div>
      ),
    },
  ]

  return (
    <Frame
      title="Persetujuan Kepegawaian"
      subtitle="Pengajuan kepegawaian yang menunggu persetujuan Anda."
      info={data && <p>Menunggu persetujuan: {semua.length}</p>}
      onExport={() =>
        downloadCsv(
          'persetujuan-kepegawaian.csv',
          ['No', 'Judul', 'Jenis', 'Diajukan Oleh', 'Terkait'],
          rows.map((p, i) => [i + 1, p.judul, JENIS_LABEL[p.jenis], p.diajukan_oleh?.name, p.guru?.nama])
        )
      }
      exportDisabled={rows.length === 0}
      filterOpen={filterOpen}
      onToggleFilter={() => setFilterOpen((v) => !v)}
      filters={<FilterInput value={cari} onChange={(e) => { setCari(e.target.value); setPage(1) }} placeholder="Cari judul atau pengaju..." />}
    >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <MembersTable
        columns={columns}
        rows={rows}
        page={page}
        onPage={setPage}
        loading={!data && !error}
        emptyText={semua.length === 0 ? 'Tidak ada pengajuan yang menunggu persetujuan.' : 'Tidak ada data yang cocok.'}
      />
    </Frame>
  )
}

function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
