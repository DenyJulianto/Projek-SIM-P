import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export default function LaporanKepsek() {
  const [dashboard, setDashboard] = useState(null)
  const [akademik, setAkademik] = useState(null)
  const [kesiswaan, setKesiswaan] = useState(null)
  const [kehadiran, setKehadiran] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.getPrincipalDashboard(),
      api.getPrincipalAkademik(),
      api.getPrincipalKesiswaan(),
      api.getPrincipalKehadiran(),
    ])
      .then(([d, a, k, h]) => {
        setDashboard(d)
        setAkademik(a)
        setKesiswaan(k)
        setKehadiran(h)
      })
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-sm text-navy/50">
          Ringkasan akademik, kesiswaan, dan kehadiran — {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => window.print()}
          className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-5 py-2 hover:bg-navy hover:text-white transition-colors"
        >
          Cetak Laporan
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {!dashboard ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : (
        <div className="space-y-6">
          <Section title="Ringkasan Umum">
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatBox label="Total Siswa" value={dashboard.total_siswa} />
              <StatBox label="Total Guru" value={dashboard.total_guru} />
              <StatBox label="Total Kelas" value={dashboard.total_kelas} />
              <StatBox label="Rata-rata Nilai" value={dashboard.rata_rata_nilai} />
              <StatBox label="Kehadiran Siswa" value={`${dashboard.kehadiran_siswa_persen}%`} />
            </div>
          </Section>

          <Section title="Akademik">
            <p className="text-sm text-navy/60 mb-3">
              Total nilai terinput: <strong>{akademik?.total_nilai_terinput ?? '-'}</strong>, rata-rata
              sekolah: <strong>{akademik?.rata_rata_sekolah ?? '-'}</strong>
            </p>
            <Table
              columns={['Kelas', 'Jumlah Siswa', 'Rata-rata Nilai']}
              rows={akademik?.per_kelas}
              render={(r) => [r.kelas, r.jumlah_siswa, r.rata_rata_nilai ?? '-']}
            />
          </Section>

          <Section title="Kesiswaan & Prestasi">
            <div className="grid sm:grid-cols-3 gap-4 mb-3">
              <StatBox label="Siswa Aktif" value={kesiswaan?.total_siswa} />
              <StatBox label="Total Prestasi" value={kesiswaan?.prestasi_total} />
              <StatBox label="Kasus Pembinaan" value={kesiswaan?.pelanggaran_total} />
            </div>
          </Section>

          <Section title="Kehadiran (Bulan Ini)">
            <div className="grid sm:grid-cols-2 gap-4">
              <StatBox label="Kehadiran Siswa" value={`${kehadiran?.siswa?.persen_hadir ?? 0}%`} />
              <StatBox label="Kehadiran Guru" value={`${kehadiran?.guru?.persen_hadir ?? 0}%`} />
            </div>
          </Section>

          <Section title="Anggaran & SPP">
            <p className="text-sm text-navy/40">{dashboard.anggaran.catatan} {dashboard.spp.catatan}</p>
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-4">
      <p className="text-xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-navy/50 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )
}

function Table({ columns, rows, render }) {
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
              <td colSpan={columns.length} className="px-4 py-6 text-center text-navy/40">Belum ada data.</td>
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
