import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Kartu, Kosong, Pesan } from './PpdbUI'
import { STATUS_PERIODE_TONE, TONE_VERIFIKASI, tgl, waktu } from './ppdbKonstanta'

const TAHAPAN = [
  ['draft', 'Draft'],
  ['dibuka', 'Pendaftaran'],
  ['ditutup', 'Ditutup'],
  ['seleksi', 'Seleksi'],
  ['pengumuman', 'Pengumuman'],
  ['daftar_ulang', 'Daftar Ulang'],
  ['selesai', 'Selesai'],
]

const PETUNJUK = {
  draft: 'Lengkapi pengaturan (jalur, kuota, persyaratan) lalu buka pendaftaran di tab Pengaturan.',
  dibuka: 'Pendaftaran berjalan. Tambahkan pendaftar dan lakukan verifikasi berkas.',
  ditutup: 'Pendaftaran ditutup. Selesaikan verifikasi lalu mulai seleksi.',
  seleksi: 'Input nilai seleksi, proses ranking, lalu terbitkan pengumuman.',
  pengumuman: 'Hasil sudah diumumkan. Buka daftar ulang untuk peserta yang lolos.',
  daftar_ulang: 'Konfirmasi daftar ulang, lalu konfirmasi penerimaan dan import ke Data Siswa.',
  selesai: 'PPDB selesai.',
}

function BatangHarian({ data }) {
  if (data.length === 0) return <Kosong>Belum ada pendaftar.</Kosong>
  const maks = Math.max(1, ...data.map((d) => d.jumlah))
  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {data.map((d) => (
          <div key={d.tanggal} className="flex-1 min-w-1 flex flex-col items-center justify-end h-full group relative">
            <span className="hidden group-hover:block absolute -top-5 text-[10px] bg-navy text-white rounded px-1.5 py-0.5 whitespace-nowrap z-10">
              {tgl(d.tanggal)}: {d.jumlah}
            </span>
            <div className="w-full rounded-t bg-gradient-to-b from-emerald-400 to-emerald-600" style={{ height: `${(d.jumlah / maks) * 100}%`, minHeight: d.jumlah ? 3 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-navy/40 mt-1.5">
        <span>{tgl(data[0].tanggal)}</span>
        <span>puncak {maks}/hari</span>
        <span>{tgl(data[data.length - 1].tanggal)}</span>
      </div>
    </div>
  )
}

function BatangMendatar({ data, warna = 'bg-emerald-500', total }) {
  if (data.length === 0) return <Kosong>Belum ada data.</Kosong>
  const maks = Math.max(1, ...data.map((d) => d.jumlah))
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.nama ?? d.label}>
          <div className="flex justify-between text-xs text-navy/70 mb-0.5">
            <span className="truncate pr-2">{d.nama ?? d.label}</span>
            <span className="font-semibold text-navy">
              {d.jumlah}
              {total ? ` (${Math.round((d.jumlah / total) * 100)}%)` : ''}
            </span>
          </div>
          <div className="h-2 bg-navy/5 rounded-full overflow-hidden">
            <div className={`h-full ${warna} rounded-full`} style={{ width: `${(d.jumlah / maks) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Panel({ judul, children, className = '' }) {
  return (
    <section className={`bg-white rounded-2xl border border-navy/5 shadow-sm p-5 ${className}`}>
      <h3 className="text-sm font-bold text-navy mb-3">{judul}</h3>
      {children}
    </section>
  )
}

export default function PpdbDashboardTab({ periodeId, onBuka }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let batal = false
    api
      .ppdbDashboard(periodeId)
      .then((r) => !batal && setD(r))
      .catch((e) => !batal && setError(e.message))
    return () => {
      batal = true
    }
  }, [periodeId])

  if (error) return <Pesan error={error} />
  if (!d) return <Kosong>Memuat dashboard…</Kosong>

  const p = d.periode
  const j = d.jumlah
  const idxTahap = TAHAPAN.findIndex(([k]) => k === p.status)
  const totalJk = d.jenis_kelamin.L + d.jenis_kelamin.P

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <Kartu label="Tahun Ajaran" nilai={p.tahun_ajaran} tone="hijau" />
        <Kartu label="Periode PPDB" nilai={<span className="text-base">{tgl(p.tanggal_mulai)}</span>} sub={`s.d. ${tgl(p.tanggal_selesai)}`} tone="biru" />
        <Kartu label="Kuota Penerimaan" nilai={p.kuota} sub={p.jumlah_rombel && p.kapasitas_rombel ? `${p.jumlah_rombel} rombel × ${p.kapasitas_rombel}` : null} tone="ungu" />
        <Kartu label="Jumlah Pendaftar" nilai={j.pendaftar} sub={j.dibatalkan ? `${j.dibatalkan} dibatalkan` : null} tone="teal" />
        <Kartu label="Sudah Diverifikasi" nilai={j.diverifikasi} tone="hijau" />
        <Kartu label="Belum Diverifikasi" nilai={j.belum_diverifikasi} sub={j.ditolak_verifikasi ? `${j.ditolak_verifikasi} ditolak` : null} tone="oranye" />
        <Kartu label="Lolos Seleksi" nilai={j.lolos} tone="hijau" />
        <Kartu label="Tidak Lolos" nilai={j.tidak_lolos} tone="merah" />
        <Kartu label="Sudah Daftar Ulang" nilai={j.sudah_daftar_ulang} tone="teal" />
        <Kartu label="Belum Daftar Ulang" nilai={j.belum_daftar_ulang} sub="dari peserta lolos" tone="oranye" />
        <Kartu label="Peserta Diterima" nilai={j.diterima} sub={d.persen_kuota !== null ? `${d.persen_kuota}% dari kuota` : null} tone="ungu" />
        <div className="rounded-2xl border border-navy/10 bg-white p-4">
          <p className="text-xs text-navy/60">Status PPDB</p>
          <span className={`inline-block mt-1.5 text-sm font-bold px-3 py-1 rounded-full ${STATUS_PERIODE_TONE[p.status]}`}>{p.status_label}</span>
        </div>
      </div>

      <Panel judul="Status & Tahapan PPDB">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {TAHAPAN.map(([k, l], i) => (
            <div key={k} className="flex items-center gap-1 shrink-0">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${i < idxTahap ? 'bg-emerald-100 text-emerald-700' : i === idxTahap ? 'bg-navy text-white' : 'bg-navy/5 text-navy/40'}`}>{l}</span>
              {i < TAHAPAN.length - 1 && <span className="text-navy/20">›</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-navy/60 mt-2">{PETUNJUK[p.status]}</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel judul="Jumlah Pendaftar per Hari">
          <BatangHarian data={d.per_hari} />
        </Panel>
        <Panel judul="Progress Penerimaan">
          <div className="mb-3">
            <div className="flex justify-between text-xs text-navy/60 mb-1">
              <span>Diterima terhadap kuota</span>
              <span className="font-bold text-navy">
                {j.diterima} / {p.kuota} {d.persen_kuota !== null && `(${d.persen_kuota}%)`}
              </span>
            </div>
            <div className="h-3 bg-navy/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${Math.min(100, d.persen_kuota ?? 0)}%` }} />
            </div>
          </div>
          <BatangMendatar data={d.progres} warna="bg-sky-500" />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel judul="Asal Sekolah">
          <BatangMendatar data={d.asal_sekolah} total={j.pendaftar} />
          {d.asal_sekolah_lainnya > 0 && <p className="text-[11px] text-navy/40 mt-2">+{d.asal_sekolah_lainnya} sekolah lainnya</p>}
        </Panel>
        <Panel judul="Jenis Kelamin">
          <BatangMendatar
            data={[
              { nama: 'Laki-laki', jumlah: d.jenis_kelamin.L },
              { nama: 'Perempuan', jumlah: d.jenis_kelamin.P },
            ]}
            warna="bg-violet-500"
            total={totalJk}
          />
        </Panel>
        <Panel judul="Pendaftar Terbaru">
          {d.terbaru.length === 0 ? (
            <Kosong>Belum ada pendaftar.</Kosong>
          ) : (
            <div className="divide-y divide-navy/5">
              {d.terbaru.map((t) => (
                <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{t.nama_lengkap}</p>
                    <p className="text-[11px] text-navy/40 truncate">
                      {t.nomor_pendaftaran} · {t.jalur} · {waktu(t.created_at)}
                    </p>
                  </div>
                  <Badge tone={TONE_VERIFIKASI[t.status_verifikasi]}>{t.status_verifikasi_label}</Badge>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => onBuka('pendaftaran')} className="text-xs font-semibold text-navy-light hover:underline mt-2">
            Lihat semua pendaftar
          </button>
        </Panel>
      </div>

      <Panel judul="Statistik per Jalur PPDB">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase text-navy/50 text-left">
                {['Jalur', 'Kuota', 'Pendaftar', 'Lolos', 'Sudah Daftar Ulang', 'Diterima', 'Kuota Terisi'].map((h) => (
                  <th key={h} className="py-1.5 pr-4 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {d.per_jalur.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-navy/40">
                    Belum ada jalur. Atur di tab Pengaturan.
                  </td>
                </tr>
              )}
              {d.per_jalur.map((x) => (
                <tr key={x.id} className={x.aktif ? '' : 'opacity-50'}>
                  <td className="py-2 pr-4 font-semibold text-navy">
                    {x.nama}
                    {!x.aktif && <span className="ml-1 text-[10px] text-navy/40">(nonaktif)</span>}
                  </td>
                  <td className="py-2 pr-4">{x.kuota}</td>
                  <td className="py-2 pr-4">{x.pendaftar}</td>
                  <td className="py-2 pr-4">{x.lolos}</td>
                  <td className="py-2 pr-4">{x.sudah_daftar_ulang}</td>
                  <td className="py-2 pr-4">{x.diterima}</td>
                  <td className="py-2 pr-4 w-40">
                    <div className="h-2 bg-navy/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${x.kuota ? Math.min(100, (x.lolos / x.kuota) * 100) : 0}%` }} />
                    </div>
                    <span className="text-[10px] text-navy/40">{x.kuota ? Math.round((x.lolos / x.kuota) * 100) : 0}% lolos dari kuota</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
