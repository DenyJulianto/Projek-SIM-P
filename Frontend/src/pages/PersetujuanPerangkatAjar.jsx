import { useCallback, useEffect, useState } from 'react'
import DokumenPerangkatAjar from '../components/DokumenPerangkatAjar'
import { api } from '../lib/api'
import { formatUkuran, KURIKULUM_META, namaFileModul, STATUS_META } from '../lib/perangkatAjar'
import { ModalBingkai, TombolTutup, TombolUnduh } from './ModulAjarManagement'

const TAB = [
  ['diajukan', 'Menunggu Persetujuan'],
  ['revisi', 'Perlu Revisi'],
  ['disetujui', 'Disetujui'],
  ['semua', 'Semua'],
]
const JENIS_LAMPIRAN = { lkpd: 'LKPD', rubrik: 'Rubrik Penilaian', bahan_bacaan: 'Bahan Bacaan', lainnya: 'Lainnya' }

function namaGuru(g) {
  return g ? [g.nama, g.gelar].filter(Boolean).join(', ') : '-'
}

function tanggal(v) {
  return v ? new Date(v).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'
}

// Peninjauan perangkat ajar guru oleh Kepala Sekolah / Waka Kurikulum:
// hanya peninjau yang bisa menyetujui atau meminta revisi.
export default function PersetujuanPerangkatAjar({ onBack }) {
  const [tab, setTab] = useState('diajukan')
  const [hasil, setHasil] = useState(null)
  const [dipilih, setDipilih] = useState(null)
  const [error, setError] = useState('')

  const muat = useCallback(() => {
    setHasil(null)
    api
      .getTinjauanPerangkatAjar(tab)
      .then(setHasil)
      .catch((e) => {
        setHasil({ data: [], jumlah: {} })
        setError(e.message)
      })
  }, [tab])

  useEffect(muat, [muat])

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 mb-1 block">
          ← Kembali ke Dashboard
        </button>
      )}
      <h1 className="text-xl font-extrabold text-slate-900">Persetujuan Perangkat Ajar</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-5">Tinjau Modul Ajar / RPP yang diajukan guru, lalu setujui atau kembalikan untuk revisi.</p>

      {error && <p className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 px-3 pt-3">
          {TAB.map(([k, label]) => {
            const n = k === 'semua' ? null : hasil?.jumlah?.[k]
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3.5 py-2 text-sm font-semibold border-b-2 -mb-px ${
                  tab === k ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
                {n > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${k === 'diajukan' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                    {n}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {hasil === null ? (
          <p className="p-6 text-sm text-slate-400">Memuat...</p>
        ) : hasil.data.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            {tab === 'diajukan' ? 'Tidak ada perangkat ajar yang menunggu persetujuan.' : 'Belum ada data.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Guru</th>
                  <th className="px-4 py-3">Mapel / Kelas</th>
                  <th className="px-4 py-3">Diajukan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasil.data.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{m.judul}</p>
                      <p className="text-xs text-slate-500">{KURIKULUM_META[m.kurikulum]?.short}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{namaGuru(m.guru)}</td>
                    <td className="px-4 py-3 text-slate-700">{[m.mata_pelajaran, m.kelas].filter(Boolean).join(' · ') || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{tanggal(m.diajukan_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_META[m.status]?.badge}`}>{STATUS_META[m.status]?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDipilih(m)} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2">
                        {m.status === 'diajukan' ? 'Tinjau' : 'Lihat'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dipilih && (
        <ModalTinjau
          modul={dipilih}
          onTutup={() => setDipilih(null)}
          onSelesai={() => {
            setDipilih(null)
            muat()
          }}
        />
      )}
    </div>
  )
}

function ModalTinjau({ modul, onTutup, onSelesai }) {
  const [aksi, setAksi] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState('')

  async function kirim() {
    if (aksi === 'revisi' && !catatan.trim()) {
      setGalat('Tuliskan catatan revisi untuk guru.')
      return
    }
    setProses(true)
    setGalat('')
    try {
      if (aksi === 'setujui') await api.setujuiPerangkatAjar(modul.id, catatan.trim() || null)
      else await api.revisiPerangkatAjar(modul.id, catatan.trim())
      onSelesai()
    } catch (e) {
      setGalat(e.message)
    } finally {
      setProses(false)
    }
  }

  return (
    <ModalBingkai onTutup={() => !proses && onTutup()} lebar>
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-slate-500">
              Diajukan oleh <b className="text-slate-700">{namaGuru(modul.guru)}</b> · {tanggal(modul.diajukan_at)}
            </p>
            <span className={`inline-block mt-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_META[modul.status]?.badge}`}>
              {STATUS_META[modul.status]?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TombolUnduh unduh={(f) => api.unduhTinjauanPerangkatAjar(modul.id, f, namaFileModul(modul, f))} />
            <TombolTutup onClick={onTutup} />
          </div>
        </div>

        {modul.catatan_review && modul.status !== 'diajukan' && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <b>Catatan peninjau{modul.peninjau ? ` (${modul.peninjau.name})` : ''}:</b> {modul.catatan_review}
          </div>
        )}

        <DokumenPerangkatAjar modul={modul} />

        {modul.lampiran?.length > 0 && (
          <div className="mt-5">
            <p className="text-[13px] font-semibold text-slate-700 mb-1.5">File lampiran</p>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {modul.lampiran.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{JENIS_LAMPIRAN[l.jenis] || l.jenis}</span>
                  <span className="flex-1 truncate">{l.nama_file}</span>
                  <span className="text-xs text-slate-400">{formatUkuran(l.ukuran)}</span>
                  <button
                    onClick={() => api.unduhLampiranTinjauan(modul.id, l).catch((e) => setGalat(e.message))}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Unduh
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {modul.status === 'diajukan' && (
          <div className="sticky bottom-0 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 mt-6 border-t border-slate-200 bg-white px-6 sm:px-8 py-4">
            {aksi ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-700">
                    {aksi === 'revisi' ? 'Catatan revisi untuk guru' : 'Catatan (opsional)'}
                    {aksi === 'revisi' && <span className="text-red-500">*</span>}
                  </span>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    autoFocus
                    placeholder={aksi === 'revisi' ? 'Bagian mana yang perlu diperbaiki?' : ''}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                {galat && <p className="text-sm text-red-600">{galat}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setAksi(null)} disabled={proses} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                    Batal
                  </button>
                  <button
                    onClick={kirim}
                    disabled={proses}
                    className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                      aksi === 'revisi' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {proses ? 'Memproses...' : aksi === 'revisi' ? 'Kirim Permintaan Revisi' : 'Setujui'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={() => setAksi('revisi')} className="rounded-full border border-orange-300 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100">
                  Minta Revisi
                </button>
                <button onClick={() => setAksi('setujui')} className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white">
                  Setujui
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalBingkai>
  )
}
