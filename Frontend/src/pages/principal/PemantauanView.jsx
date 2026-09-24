import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const TITLES = {
  akademik: 'Pemantauan Akademik',
  kesiswaan: 'Pemantauan Kesiswaan & Prestasi',
  kehadiran: 'Pemantauan Kehadiran',
  keuangan: 'Pemantauan Keuangan',
  kepegawaian: 'Pemantauan Kepegawaian',
  sarpras: 'Pemantauan Sarana & Prasarana',
}

export default function PemantauanView({ section }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy mb-1">{TITLES[section]}</h1>
      <p className="text-sm text-navy/50 mb-6">Rekap informasi — bukan halaman kelola data.</p>

      {section === 'akademik' && <AkademikSection />}
      {section === 'kesiswaan' && <KesiswaanSection />}
      {section === 'kehadiran' && <KehadiranSection />}
      {section === 'keuangan' && <KeuanganSection />}
      {section === 'kepegawaian' && <KepegawaianSection />}
      {section === 'sarpras' && <SarprasSection />}
    </div>
  )
}

function useFetch(fn) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fn()
      .then(setData)
      .catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, error }
}

function Loading({ error }) {
  if (error) return <p className="text-red-600 text-sm">{error}</p>
  return <p className="text-navy/40 text-center py-10">Memuat...</p>
}

function AkademikSection() {
  const { data, error } = useFetch(api.getPrincipalAkademik)
  if (!data) return <Loading error={error} />

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <StatBox label="Rata-rata Nilai Sekolah" value={data.rata_rata_sekolah} />
        <StatBox label="Total Nilai Terinput" value={data.total_nilai_terinput} />
      </div>

      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Rata-rata per Kelas</h2>
        <Table
          columns={['Kelas', 'Jumlah Siswa', 'Rata-rata Nilai']}
          rows={data.per_kelas}
          render={(r) => [r.kelas, r.jumlah_siswa, r.rata_rata_nilai ?? '-']}
          emptyText="Belum ada kelas."
        />
      </div>

      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Rata-rata per Mata Pelajaran</h2>
        <Table
          columns={['Mata Pelajaran', 'Jumlah Nilai', 'Rata-rata']}
          rows={data.per_mata_pelajaran}
          render={(r) => [r.mata_pelajaran, r.jumlah_nilai, r.rata_rata_nilai ?? '-']}
          emptyText="Belum ada mata pelajaran."
        />
      </div>
    </div>
  )
}

function KesiswaanSection() {
  const { data, error } = useFetch(api.getPrincipalKesiswaan)
  if (!data) return <Loading error={error} />

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatBox label="Total Siswa Aktif" value={data.total_siswa} />
        <StatBox label="Total Prestasi" value={data.prestasi_total} />
        <StatBox label="Total Kasus Pembinaan" value={data.pelanggaran_total} />
      </div>

      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Siswa per Kelas</h2>
        <Table
          columns={['Kelas', 'Jumlah Siswa']}
          rows={data.per_kelas}
          render={(r) => [r.kelas, r.jumlah_siswa]}
          emptyText="Belum ada kelas."
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Prestasi Terbaru</h2>
          <ListCard
            items={data.prestasi_terbaru}
            render={(p) => `${p.siswa?.nama || '-'} — ${p.judul} (${p.tingkat})`}
            emptyText="Belum ada catatan prestasi."
          />
        </div>
        <div>
          <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Kasus Pembinaan Terbaru</h2>
          <ListCard
            items={data.pelanggaran_terbaru}
            render={(p) => `${p.siswa?.nama || '-'} — ${p.jenis} (${p.tingkat})`}
            emptyText="Belum ada catatan pelanggaran."
          />
        </div>
      </div>
    </div>
  )
}

function KehadiranSection() {
  const { data, error } = useFetch(api.getPrincipalKehadiran)
  if (!data) return <Loading error={error} />

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Kehadiran Siswa (Bulan Ini)</h2>
        <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-5">
          <p className="text-3xl font-extrabold text-navy mb-3">{data.siswa.persen_hadir}%</p>
          <RekapBadges rekap={data.siswa.rekap} />
        </div>
      </div>
      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Kehadiran Guru (Bulan Ini)</h2>
        <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-5">
          <p className="text-3xl font-extrabold text-navy mb-3">{data.guru.persen_hadir}%</p>
          <RekapBadges rekap={data.guru.rekap} />
        </div>
      </div>
    </div>
  )
}

function KeuanganSection() {
  const { data, error } = useFetch(api.getPrincipalKeuangan)
  if (!data) return <Loading error={error} />

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Tagihan" value={data.total_tagihan} />
        <StatBox label="Lunas" value={`${data.lunas} (${data.persen_lunas}%)`} />
        <StatBox label="Belum Lunas" value={data.belum_lunas} />
        <StatBox label="Tunggakan" value={formatRupiah(data.tunggakan)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <StatBox label="Total Nilai Tagihan" value={formatRupiah(data.total_nilai_tagihan)} />
        <StatBox label="Total Terbayar" value={formatRupiah(data.total_terbayar)} />
      </div>
    </div>
  )
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value || 0
  )
}

function KepegawaianSection() {
  const { data, error } = useFetch(api.getPrincipalKepegawaian)
  if (!data) return <Loading error={error} />

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatBox label="Total Pegawai" value={data.total} />
        <StatBox label="Aktif" value={data.aktif} />
        <StatBox label="Nonaktif" value={data.nonaktif} />
      </div>
      <Table
        columns={['Nama', 'NIP', 'Jabatan', 'Status']}
        rows={data.daftar}
        render={(g) => [g.nama, g.nip || '-', g.jabatan || '-', g.status]}
        emptyText="Belum ada data guru."
      />
    </div>
  )
}

function SarprasSection() {
  const { data, error } = useFetch(api.getPrincipalSarpras)
  if (!data) return <Loading error={error} />

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <StatBox label="Total Item" value={data.total_item} />
        <StatBox label="Jumlah Jenis Barang" value={data.total_jenis} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Per Kondisi</h2>
          <BreakdownList data={data.per_kondisi} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Per Kategori</h2>
          <BreakdownList data={data.per_kategori} />
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-5">
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-navy/50 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )
}

function Table({ columns, rows, render, emptyText }) {
  return (
    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase text-left">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!rows || rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-navy/40">{emptyText}</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-emerald-100 odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                {render(r).map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-navy/70">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function ListCard({ items, render, emptyText }) {
  return (
    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 divide-y divide-emerald-100">
      {!items || items.length === 0 ? (
        <p className="text-sm text-navy/40 text-center py-6">{emptyText}</p>
      ) : (
        items.map((item, i) => (
          <p key={i} className="px-4 py-3 text-sm text-navy/70">{render(item)}</p>
        ))
      )}
    </div>
  )
}

function RekapBadges({ rekap }) {
  const labels = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpha: 'Alpha' }
  const entries = Object.entries(labels)
  const hasData = entries.some(([key]) => rekap?.[key])

  if (!hasData) return <p className="text-sm text-navy/40">Belum ada data absensi bulan ini.</p>

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, label]) => (
        <span key={key} className="text-xs font-semibold bg-navy/5 text-navy/70 px-3 py-1.5 rounded-full">
          {label}: {rekap?.[key] || 0}
        </span>
      ))}
    </div>
  )
}

function BreakdownList({ data }) {
  const entries = Object.entries(data || {})
  if (entries.length === 0) {
    return <p className="text-sm text-navy/40 bg-emerald-50/70 rounded-2xl border border-emerald-100 p-5">Belum ada data.</p>
  }

  return (
    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 divide-y divide-emerald-100">
      {entries.map(([key, value]) => (
        <div key={key} className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-navy/70 capitalize">{key.replace(/_/g, ' ')}</span>
          <span className="text-sm font-semibold text-navy">{value}</span>
        </div>
      ))}
    </div>
  )
}
