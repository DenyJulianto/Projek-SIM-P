import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const TITLES = {
  guru: 'Data Guru',
  pegawai: 'Data Pegawai',
  pengajuan: 'Pengajuan Kepegawaian',
  persetujuan: 'Persetujuan Kepegawaian',
}

export default function KepegawaianKepsekView({ tab }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy mb-1">{TITLES[tab]}</h1>
      <p className="text-sm text-navy/50 mb-6">
        {tab === 'guru' || tab === 'pegawai'
          ? 'Tampilan baca saja — pengelolaan data dilakukan oleh Tata Usaha.'
          : 'Alur pengajuan & persetujuan kepegawaian.'}
      </p>

      {(tab === 'guru' || tab === 'pegawai') && <DaftarPegawai tab={tab} />}
      {tab === 'pengajuan' && <PengajuanList />}
      {tab === 'persetujuan' && <PersetujuanList />}
    </div>
  )
}

const JENIS_LABEL = {
  rekrutmen: 'Rekrutmen',
  promosi: 'Promosi',
  mutasi: 'Mutasi',
  pemberhentian: 'Pemberhentian',
  lainnya: 'Lainnya',
}

const STATUS_STYLE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

function PengajuanList() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listPengajuanKepegawaian().then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
            <th className="px-4 py-3">Judul</th>
            <th className="px-4 py-3">Jenis</th>
            <th className="px-4 py-3">Diajukan Oleh</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-navy/40">Belum ada pengajuan kepegawaian.</td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="border-t border-navy/5">
                <td className="px-4 py-3 font-medium text-navy">{item.judul}</td>
                <td className="px-4 py-3 text-navy/60">{JENIS_LABEL[item.jenis]}</td>
                <td className="px-4 py-3 text-navy/60">{item.diajukan_oleh?.name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[item.status]}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function PersetujuanList() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    api.listPengajuanKepegawaian({ status: 'diajukan' }).then(setData).catch((err) => setError(err.message))
  }

  useEffect(load, [])

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

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
      {data.length === 0 ? (
        <p className="text-sm text-navy/40 text-center py-8">Tidak ada pengajuan yang menunggu persetujuan.</p>
      ) : (
        data.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-navy">
                {item.judul} <span className="text-navy/40 font-normal">({JENIS_LABEL[item.jenis]})</span>
              </p>
              <p className="text-xs text-navy/50 mt-0.5">
                Diajukan oleh {item.diajukan_oleh?.name || '-'}
                {item.guru && ` · terkait: ${item.guru.nama}`}
              </p>
              {item.keterangan && <p className="text-xs text-navy/40 mt-1">{item.keterangan}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleReject(item)}
                disabled={busyId === item.id}
                className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
              >
                Tolak
              </button>
              <button
                onClick={() => handleApprove(item)}
                disabled={busyId === item.id}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50"
              >
                Setujui
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DaftarPegawai({ tab }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPrincipalKepegawaian().then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div className="space-y-4">
      {tab === 'pegawai' && (
        <p className="text-xs text-navy/40 bg-navy/5 rounded-lg px-4 py-2.5">
          Sistem ini belum memisahkan data pegawai non-guru (Tata Usaha, dsb) dari data guru —
          seluruh data kepegawaian yang tercatat saat ini ditampilkan di sini.
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <StatBox label="Total" value={data.total} />
        <StatBox label="Aktif" value={data.aktif} />
        <StatBox label="Nonaktif" value={data.nonaktif} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">NIP</th>
              <th className="px-4 py-3">Jabatan</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.daftar.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">Belum ada data.</td>
              </tr>
            ) : (
              data.daftar.map((g) => (
                <tr key={g.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{g.nama}</td>
                  <td className="px-4 py-3 text-navy/60">{g.nip || '-'}</td>
                  <td className="px-4 py-3 text-navy/60">{g.jabatan || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        g.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5">
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-navy/50 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )
}
