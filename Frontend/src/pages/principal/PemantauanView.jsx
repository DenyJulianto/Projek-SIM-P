import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const TITLES = {
  akademik: 'Pemantauan Akademik',
  kesiswaan: 'Pemantauan Kesiswaan & Prestasi',
  kehadiran: 'Pemantauan Kehadiran',
  keuangan: 'Pemantauan Keuangan',
  kepegawaian: 'Pemantauan Kepegawaian',
  sarpras: 'Pemantauan Sarana & Prasarana',
  jadwal: 'Pemantauan Jadwal Pelajaran',
  surat: 'Pemantauan Persuratan',
  'prestasi-pelanggaran': 'Pemantauan Prestasi & Pelanggaran',
}

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const SURAT_STATUS_STYLE = {
  baru: 'bg-navy/10 text-navy/60',
  diproses: 'bg-amber-100 text-amber-700',
  selesai: 'bg-emerald-100 text-emerald-700',
}

const TINGKAT_PELANGGARAN_TONE = {
  ringan: 'bg-navy/10 text-navy/60',
  sedang: 'bg-amber-100 text-amber-700',
  berat: 'bg-red-100 text-red-600',
}

const TINGKAT_PRESTASI_LABEL = {
  sekolah: 'Sekolah',
  kecamatan: 'Kecamatan',
  kabupaten_kota: 'Kab/Kota',
  provinsi: 'Provinsi',
  nasional: 'Nasional',
  internasional: 'Internasional',
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
      {section === 'jadwal' && <JadwalSection />}
      {section === 'surat' && <SuratSection />}
      {section === 'prestasi-pelanggaran' && <PrestasiPelanggaranSection />}
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
          render={(r) => [r.kelas, r.jumlah_siswa, <ScoreBadge value={r.rata_rata_nilai} />]}
          emptyText="Belum ada kelas."
        />
      </div>

      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Rata-rata per Mata Pelajaran</h2>
        <Table
          columns={['Mata Pelajaran', 'Jumlah Nilai', 'Rata-rata']}
          rows={data.per_mata_pelajaran}
          render={(r) => [r.mata_pelajaran, r.jumlah_nilai, <ScoreBadge value={r.rata_rata_nilai} />]}
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
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <p className="text-3xl font-extrabold text-navy mb-3">{data.siswa.persen_hadir}%</p>
          <RekapBadges rekap={data.siswa.rekap} />
        </div>
      </div>
      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Kehadiran Guru (Bulan Ini)</h2>
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
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
        render={(g) => [g.nama, g.nip || '-', g.jabatan || '-', <StatusBadge status={g.status} />]}
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

function JadwalSection() {
  const { data, error } = useFetch(() => api.listJadwal({ per_page: 500 }))
  if (!data) return <Loading error={error} />

  const items = data.data || []
  const grouped = HARI_ORDER.map((hari) => ({
    hari,
    items: items.filter((j) => j.hari === hari).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)),
  }))

  return (
    <div className="space-y-6">
      {grouped.map(({ hari, items: hariItems }) => (
        <div key={hari}>
          <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">{hari}</h2>
          <Table
            columns={['Jam', 'Kelas', 'Mata Pelajaran', 'Guru']}
            rows={hariItems}
            render={(item) => [
              `${item.jam_mulai?.slice(0, 5)} - ${item.jam_selesai?.slice(0, 5)}`,
              item.kelas?.nama_kelas || '-',
              item.mata_pelajaran?.nama_mapel || '-',
              item.guru?.nama || '-',
            ]}
            emptyText="Belum ada jadwal."
          />
        </div>
      ))}
    </div>
  )
}

function SuratSection() {
  const { data, error } = useFetch(() => api.listSurat({ per_page: 200 }))
  if (!data) return <Loading error={error} />

  const items = data.data || []

  return (
    <Table
      columns={['Perihal', 'Jenis', 'Pengirim/Tujuan', 'Tgl. Agenda', 'Status']}
      rows={items}
      render={(item) => [
        item.perihal,
        <span className="capitalize">{item.jenis}</span>,
        item.jenis === 'masuk' ? item.pengirim || '-' : item.tujuan || '-',
        item.tanggal_agenda?.slice(0, 10) || '-',
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SURAT_STATUS_STYLE[item.status] || 'bg-navy/10 text-navy/60'}`}>
          {item.status}
        </span>,
      ]}
      emptyText="Belum ada surat tercatat."
    />
  )
}

function PrestasiPelanggaranSection() {
  const { data: prestasiData, error: prestasiError } = useFetch(() => api.listPrestasi({ per_page: 300 }))
  const { data: pelanggaranData, error: pelanggaranError } = useFetch(() => api.listPelanggaran({ per_page: 300 }))

  const prestasi = prestasiData?.data || []
  const pelanggaran = pelanggaranData?.data || []

  const prestasiCounts = {}
  prestasi.forEach((p) => { prestasiCounts[p.tingkat] = (prestasiCounts[p.tingkat] || 0) + 1 })

  const pelanggaranCounts = { ringan: 0, sedang: 0, berat: 0 }
  pelanggaran.forEach((p) => { pelanggaranCounts[p.tingkat] = (pelanggaranCounts[p.tingkat] || 0) + 1 })

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-3">Prestasi Siswa</h2>
        {!prestasiData ? (
          <Loading error={prestasiError} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <StatBox label="Total" value={prestasi.length} />
              {Object.entries(TINGKAT_PRESTASI_LABEL).map(([key, label]) => (
                <StatBox key={key} label={label} value={prestasiCounts[key] || 0} />
              ))}
            </div>
            <Table
              columns={['Siswa', 'Judul', 'Tingkat', 'Tanggal']}
              rows={prestasi}
              render={(item) => [
                item.siswa?.nama || '-',
                item.judul,
                TINGKAT_PRESTASI_LABEL[item.tingkat] || item.tingkat,
                item.tanggal?.slice(0, 10) || '-',
              ]}
              emptyText="Belum ada prestasi tercatat."
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-3">Pelanggaran Siswa</h2>
        {!pelanggaranData ? (
          <Loading error={pelanggaranError} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Total Kasus" value={pelanggaran.length} />
              <StatBox label="Ringan" value={pelanggaranCounts.ringan} />
              <StatBox label="Sedang" value={pelanggaranCounts.sedang} />
              <StatBox label="Berat" value={pelanggaranCounts.berat} />
            </div>
            <Table
              columns={['Siswa', 'Jenis', 'Tingkat', 'Tanggal']}
              rows={pelanggaran}
              render={(item) => [
                item.siswa?.nama || '-',
                item.jenis,
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${TINGKAT_PELANGGARAN_TONE[item.tingkat] || 'bg-navy/10 text-navy/60'}`}>
                  {item.tingkat}
                </span>,
                item.tanggal?.slice(0, 10) || '-',
              ]}
              emptyText="Belum ada pelanggaran tercatat."
            />
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-navy/50 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )
}

function Table({ columns, rows, render, emptyText }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-navy/15 shadow-sm overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-navy-light/10 via-emerald-50/60 to-navy-light/10 text-navy/70 text-[11px] font-bold uppercase tracking-wider text-left">
            {columns.map((c, i) => (
              <th
                key={c}
                className={`px-5 py-3.5 border-b-2 border-navy/15 ${i > 0 ? 'border-l border-navy/10' : ''}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!rows || rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-navy/40">{emptyText}</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                className={`border-t border-navy/10 hover:bg-emerald-50/50 transition-colors ${
                  i % 2 === 1 ? 'bg-navy/[0.015]' : ''
                }`}
              >
                {render(r).map((cell, j) => (
                  <td
                    key={j}
                    className={`px-5 py-3.5 text-navy/70 ${j > 0 ? 'border-l border-navy/10' : ''}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function ScoreBadge({ value }) {
  if (value === null || value === undefined) return <span className="text-navy/30">-</span>

  const tone = value >= 85 ? 'bg-emerald-100 text-emerald-700' : value >= 75 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'

  return <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${tone}`}>{value}</span>
}

function StatusBadge({ status }) {
  const isAktif = status === 'aktif'
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        isAktif ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/10 text-navy/50'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-navy/30'}`} />
      {isAktif ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

function ListCard({ items, render, emptyText }) {
  return (
    <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
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
    return <p className="text-sm text-navy/40 bg-white rounded-2xl border border-navy/10 p-5">Belum ada data.</p>
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
      {entries.map(([key, value]) => (
        <div key={key} className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-navy/70 capitalize">{key.replace(/_/g, ' ')}</span>
          <span className="text-sm font-semibold text-navy">{value}</span>
        </div>
      ))}
    </div>
  )
}
