import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const JENIS = [
  ['harian', 'Harian'],
  ['tugas', 'Tugas'],
  ['uts', 'UTS'],
  ['uas', 'UAS'],
]
const AKSI = [
  ['setujui', 'Setujui', 'Nilai benar dan layak masuk rapor.'],
  ['perbaikan', 'Ajukan Perbaikan', 'Ada bagian yang perlu dikoreksi guru, lalu diajukan kembali.'],
  ['tolak', 'Tolak', 'Nilai tidak layak dan perlu disusun ulang.'],
]
const primaryBtn = 'bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50'

export default function VerifikasiNilaiModal({ row, params, bisaMemverifikasi, onClose, onSaved }) {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('pemeriksaan')
  const [aksi, setAksi] = useState('setujui')
  const [catatan, setCatatan] = useState('')
  const [bukaKunci, setBukaKunci] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .periksaVerifikasiNilai({ ...params, kelas_id: row.kelas.id, mata_pelajaran_id: row.mata_pelajaran.id })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [params, row])

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.keputusanVerifikasiNilai({
        ...params,
        kelas_id: row.kelas.id,
        mata_pelajaran_id: row.mata_pelajaran.id,
        aksi,
        catatan: catatan.trim() || null,
        buka_kunci: bukaKunci,
      })
      onSaved(res.message, res.peringatan)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const p = data?.pemeriksaan
  const terkunci = data?.baris.status_kunci === 'terkunci'
  const minCatatan = aksi === 'setujui' ? (p?.perlu_catatan_setuju ? 5 : 0) : 10
  const catatanCukup = catatan.trim().length >= minCatatan
  const blokirSetuju = aksi === 'setujui' && p && !p.dapat_disetujui

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-3xl w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
<ModalCloseButton onClose={onClose} />
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-lg font-extrabold text-navy">
              {row.mata_pelajaran.nama_mapel} — {row.kelas.nama_kelas}
            </h2>
            <p className="text-xs text-navy/50 capitalize">
              Tahun Ajaran {row.tahun_ajaran} · Semester {row.semester} · Guru: {row.guru.map((g) => g.nama).join(', ') || '-'}
            </p>
          </div>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {!data && !error && <p className="text-sm text-navy/40 text-center py-10">Memeriksa nilai...</p>}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
              <span className={`font-semibold px-2.5 py-1 rounded-full ${terkunci ? 'bg-navy text-white' : 'bg-amber-100 text-amber-700'}`}>{terkunci ? '🔒 Terkunci' : 'Belum dikunci'}</span>
              {data.verifikasi && (
                <span className="text-navy/60">
                  Verifikasi terakhir: <b>{data.verifikasi.status_label}</b> oleh {data.verifikasi.verifikator || '-'}
                  {data.verifikasi.tanggal_verifikasi ? `, ${new Date(data.verifikasi.tanggal_verifikasi).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
                </span>
              )}
            </div>
            {data.verifikasi?.catatan && <p className="text-xs bg-navy/5 rounded-lg p-2 mb-3 text-navy/70">Catatan sebelumnya: {data.verifikasi.catatan}</p>}

            <div className="flex gap-1 border-b border-navy/10 mb-4">
              {[
                ['pemeriksaan', 'Hasil Pemeriksaan'],
                ['detail', 'Detail Nilai'],
              ].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 text-sm font-semibold -mb-px border-b-2 ${tab === k ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
                  {l}
                </button>
              ))}
            </div>

            {tab === 'pemeriksaan' && (
              <div className="space-y-2 mb-5">
                <Cek
                  judul="Kelengkapan"
                  status={p.kelengkapan.status === 'lengkap' ? 'ok' : 'peringatan'}
                  ringkas={`${p.kelengkapan.persen ?? '-'}% — ${p.kelengkapan.nilai_diinput}/${p.kelengkapan.total_seharusnya} komponen terisi`}
                />
                <Cek
                  judul="Nilai kosong"
                  status={p.nilai_kosong.jumlah_siswa === 0 ? 'ok' : 'peringatan'}
                  ringkas={p.nilai_kosong.jumlah_siswa === 0 ? 'Tidak ada nilai kosong' : `${p.nilai_kosong.jumlah_siswa} siswa memiliki komponen kosong`}
                  daftar={p.nilai_kosong.daftar.map((s) => `${s.nama} — ${s.komponen.join(', ')}`)}
                />
                <Cek
                  judul={`Nilai di luar batas (${p.di_luar_batas.rentang})`}
                  status={p.di_luar_batas.jumlah === 0 ? 'ok' : 'kesalahan'}
                  ringkas={p.di_luar_batas.jumlah === 0 ? 'Semua nilai dalam rentang' : `${p.di_luar_batas.jumlah} nilai di luar rentang — tidak dapat disetujui`}
                  daftar={p.di_luar_batas.daftar.map((n) => `${n.siswa} — ${n.komponen}: ${n.nilai}`)}
                />
                <Cek
                  judul="Konsistensi nilai"
                  status={p.konsistensi.jumlah === 0 ? 'ok' : 'peringatan'}
                  ringkas={p.konsistensi.jumlah === 0 ? 'Tidak ada temuan' : `${p.konsistensi.jumlah} temuan perlu dicek`}
                  daftar={p.konsistensi.temuan.flatMap((t) => [t.pesan, ...t.siswa.map((s) => `• ${s}`)])}
                />
                {p.di_bawah_kkm && (
                  <Cek
                    judul={`Informasi: rata-rata di bawah KKM (${p.di_bawah_kkm.kkm})`}
                    status="info"
                    ringkas={p.di_bawah_kkm.jumlah === 0 ? 'Semua siswa mencapai KKM' : `${p.di_bawah_kkm.jumlah} siswa di bawah KKM`}
                    daftar={p.di_bawah_kkm.daftar.map((s) => `${s.nama} — rata-rata ${s.rata_rata}`)}
                  />
                )}
                <p className="text-[11px] text-navy/40">
                  Ambang lonjakan: selisih rata-rata harian/tugas dan UTS/UAS ≥ {p.konsistensi.ambang_lonjakan} poin. Pemeriksaan bersifat penanda; keputusan tetap di tangan verifikator.
                </p>
              </div>
            )}

            {tab === 'detail' && (
              <div className="border border-navy/10 rounded-xl overflow-x-auto mb-5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-navy/5 text-navy/60 uppercase text-left">
                      <th className="px-3 py-2">Siswa</th>
                      {JENIS.map(([k, l]) => (
                        <th key={k} className="px-3 py-2 text-center">
                          {l}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right">Rata-rata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.siswa.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-navy/40">
                          Tidak ada siswa aktif.
                        </td>
                      </tr>
                    )}
                    {data.siswa.map((s) => (
                      <tr key={s.id} className="border-t border-navy/5">
                        <td className="px-3 py-2">
                          <span className="font-medium text-navy">{s.nama}</span>
                          <span className="block text-navy/40">{s.nis || '-'}</span>
                        </td>
                        {JENIS.map(([k]) => {
                          const vals = s.nilai[k]
                          const kosong = vals.length === 0
                          const luar = vals.some((v) => v < 0 || v > 100)
                          return (
                            <td key={k} className={`px-3 py-2 text-center ${kosong ? 'bg-red-50 text-red-600 font-semibold' : luar ? 'bg-red-100 text-red-700 font-semibold' : 'text-navy/70'}`}>
                              {kosong ? 'Kosong' : vals.join(', ')}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-right font-semibold text-navy">{s.rata_rata ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {bisaMemverifikasi ? (
              <form onSubmit={submit} className="border-t border-navy/10 pt-4 space-y-3">
                <p className="text-sm font-bold text-navy">Keputusan Verifikasi</p>
                {!terkunci && <p className="text-xs text-red-600">Nilai belum dikunci, jadi belum dapat diverifikasi. Kunci dulu di menu Penguncian Nilai.</p>}
                <div className="grid sm:grid-cols-3 gap-2">
                  {AKSI.map(([v, l, d]) => (
                    <label key={v} className={`border rounded-xl p-3 cursor-pointer ${aksi === v ? 'border-navy bg-navy/5' : 'border-navy/15'}`}>
                      <input type="radio" name="aksi" className="mr-1.5" checked={aksi === v} onChange={() => setAksi(v)} disabled={!terkunci} />
                      <span className="text-sm font-semibold text-navy">{l}</span>
                      <span className="block text-[11px] text-navy/50 mt-0.5">{d}</span>
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="block text-xs font-semibold text-navy/70 mb-1">
                    Catatan verifikasi {aksi === 'setujui' ? (p.perlu_catatan_setuju ? '(wajib — ada temuan)' : '(opsional)') : '(wajib — jelaskan alasan dan apa yang perlu diperbaiki)'}
                  </span>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    maxLength={2000}
                    className="input min-h-24"
                    disabled={!terkunci}
                    placeholder={
                      aksi === 'setujui'
                        ? 'mis. Temuan lonjakan Tes B sudah dikonfirmasi guru.'
                        : 'mis. Nilai UTS siswa Tes B (30) tidak sesuai lembar jawaban; mohon koreksi dan kunci ulang.'
                    }
                  />
                </label>

                {aksi !== 'setujui' && (
                  <label className="flex items-start gap-2 text-xs text-navy/70">
                    <input type="checkbox" className="mt-0.5" checked={bukaKunci} onChange={(e) => setBukaKunci(e.target.checked)} />
                    Buka kunci nilai otomatis agar guru dapat memperbaikinya (guru menerima notifikasi berisi catatan ini).
                  </label>
                )}
                {blokirSetuju && <p className="text-xs text-red-600">Tidak dapat disetujui: terdapat nilai di luar batas. Pilih Ajukan Perbaikan.</p>}

                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
                    Tutup
                  </button>
                  <button type="submit" disabled={saving || !terkunci || !catatanCukup || blokirSetuju} className={primaryBtn}>
                    {saving ? 'Menyimpan...' : aksi === 'setujui' ? 'Setujui Nilai' : aksi === 'tolak' ? 'Tolak Nilai' : 'Ajukan Perbaikan'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-amber-700 border-t border-navy/10 pt-3">Akun Anda tidak memiliki hak memverifikasi nilai (izin nilai.verify); Anda hanya dapat melihat hasil pemeriksaan.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const TONE = {
  ok: ['bg-emerald-50 border-emerald-200', 'text-emerald-700', '✓'],
  peringatan: ['bg-amber-50 border-amber-200', 'text-amber-800', '!'],
  kesalahan: ['bg-red-50 border-red-200', 'text-red-700', '✕'],
  info: ['bg-sky-50 border-sky-200', 'text-sky-800', 'i'],
}

function Cek({ judul, status, ringkas, daftar = [] }) {
  const [box, teks, ikon] = TONE[status]
  return (
    <div className={`border rounded-xl p-3 ${box}`}>
      <p className={`text-sm font-semibold ${teks}`}>
        {ikon} {judul}
      </p>
      <p className={`text-xs ${teks}`}>{ringkas}</p>
      {daftar.length > 0 && (
        <ul className={`mt-1.5 text-xs space-y-0.5 max-h-32 overflow-y-auto ${teks}`}>
          {daftar.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
