import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Kosong, ModalPesan, Pesan } from './PpdbUI'
import { selectClass, tgl, waktu } from './ppdbKonstanta'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #ppdb-hasil-print, #ppdb-hasil-print * { visibility: visible !important; }
  #ppdb-hasil-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .ppdb-noprint { display: none !important; }
  @page { size: A4 portrait; margin: 14mm; }
}
`

function CetakHasil({ data, baris, filter, onClose }) {
  const [sekolah, setSekolah] = useState(null)
  useEffect(() => {
    api.getProfil().then(setSekolah).catch(() => {})
  }, [])
  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="ppdb-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Hasil Seleksi</p>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>
      <div id="ppdb-hasil-print" className="max-w-[800px] mx-auto p-8 text-[11px] text-black">
        <div className="text-center mb-4">
          <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
          <p className="text-base font-extrabold uppercase">Hasil Seleksi {data.periode.nama}</p>
          <p className="text-xs">
            Tahun Ajaran {data.periode.tahun_ajaran}
            {filter === 'lolos' ? ' — Peserta Lolos' : filter === 'tidak_lolos' ? ' — Peserta Tidak Lolos' : ''}
          </p>
        </div>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              {['No', 'No. Pendaftaran', 'Nama', 'Jalur', 'Asal Sekolah', 'Status'].map((h) => (
                <th key={h} className="border border-black px-1.5 py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((b, i) => (
              <tr key={b.id} style={{ breakInside: 'avoid' }}>
                <td className="border border-black px-1.5 py-0.5">{i + 1}</td>
                <td className="border border-black px-1.5 py-0.5">{b.nomor_pendaftaran}</td>
                <td className="border border-black px-1.5 py-0.5">{b.nama_lengkap}</td>
                <td className="border border-black px-1.5 py-0.5">{b.jalur}</td>
                <td className="border border-black px-1.5 py-0.5">{b.sekolah_asal || '-'}</td>
                <td className="border border-black px-1.5 py-0.5 font-semibold">{b.kelulusan_label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-10 ml-auto w-64 text-center" style={{ breakInside: 'avoid' }}>
          <p>Ditetapkan pada {tgl(data.periode.jadwal_pengumuman) !== '-' ? tgl(data.periode.jadwal_pengumuman) : tgl(data.terbit_at)}</p>
          <p>Ketua Panitia PPDB</p>
          <div className="h-16" />
          <p>(............................................)</p>
        </div>
      </div>
    </div>
  )
}

export default function PpdbPengumumanTab({ periode, onBerubah }) {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState({ status: '', jalur_id: '', search: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [cetak, setCetak] = useState(false)
  const [notif, setNotif] = useState(null)

  const muat = useCallback(
    () =>
      api
        .ppdbPengumuman({ periode_id: periode.id, ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)) })
        .then(setData)
        .catch((e) => setError(e.message)),
    [periode.id, filter],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  if (!data) return <Kosong>{error || 'Memuat…'}</Kosong>

  async function jalankan(fn, sukses) {
    setError('')
    setInfo('')
    try {
      const r = await fn()
      setInfo(sukses ?? r?.message ?? '')
      await muat()
      onBerubah?.()
    } catch (e) {
      setError(e.message)
    }
  }

  const params = { periode_id: periode.id, ...(filter.status ? { status: filter.status } : {}), ...(filter.jalur_id ? { jalur_id: filter.jalur_id } : {}) }

  return (
    <div className="space-y-4">
      <Pesan error={error} info={info} />

      <section className="bg-white rounded-2xl border border-navy/10 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-navy">Status Pengumuman</h2>
              <Badge tone={data.terbit ? 'hijau' : 'kuning'}>{data.terbit ? 'Sudah diterbitkan' : 'Belum diterbitkan'}</Badge>
            </div>
            <p className="text-xs text-navy/50 mt-1">
              Jadwal pengumuman: {tgl(data.periode.jadwal_pengumuman)}
              {data.terbit && ` · diterbitkan ${waktu(data.terbit_at)}`}
            </p>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            {!data.terbit ? (
              <>
                <label className="block">
                  <span className="block text-[11px] font-semibold text-navy/60 mb-1">Tanggal pengumuman</span>
                  <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={selectClass} />
                </label>
                <Btn
                  utama
                  disabled={!data.siap_terbit}
                  onClick={() => {
                    if (window.confirm('Terbitkan pengumuman hasil seleksi? Hasil seleksi akan terkunci.')) jalankan(() => api.ppdbTerbitkanPengumuman({ periode_id: periode.id, tanggal_pengumuman: tanggal || null }))
                  }}
                >
                  Publikasikan Hasil Seleksi
                </Btn>
              </>
            ) : (
              <Btn
                bahaya
                onClick={() => {
                  const alasan = window.prompt('Alasan membatalkan publikasi:')
                  if (alasan) jalankan(() => api.ppdbBatalkanPengumuman({ periode_id: periode.id, alasan }))
                }}
              >
                Batalkan Publikasi
              </Btn>
            )}
          </div>
        </div>
        {!data.terbit && data.kendala.length > 0 && (
          <ul className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 space-y-1 list-disc list-inside">
            {data.kendala.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          {[
            ['Lolos', data.ringkasan.lolos],
            ['Tidak lolos', data.ringkasan.tidak_lolos],
            ['Belum diputuskan', data.ringkasan.belum_diputuskan],
          ].map(([l, n]) => (
            <div key={l} className="bg-navy/5 rounded-xl py-2">
              <p className="text-[11px] text-navy/50">{l}</p>
              <p className="text-xl font-extrabold text-navy">{n}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-2 flex-wrap">
        <input value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} placeholder="Cari nama / nomor…" className={`${selectClass} w-56`} />
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className={selectClass}>
          <option value="">Semua (lolos & tidak lolos)</option>
          <option value="lolos">Daftar siswa lolos</option>
          <option value="tidak_lolos">Daftar siswa tidak lolos</option>
        </select>
        <select value={filter.jalur_id} onChange={(e) => setFilter((f) => ({ ...f, jalur_id: e.target.value }))} className={selectClass}>
          <option value="">Semua jalur</option>
          {periode.jalur.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama}
            </option>
          ))}
        </select>
        <span className="flex-1" />
        <Btn disabled={!data.terbit} title={data.terbit ? '' : 'Terbitkan pengumuman terlebih dahulu'} onClick={() => api.ppdbPdfHasil(params).catch((e) => setError(e.message))}>
          Download PDF
        </Btn>
        <Btn utama disabled={!data.terbit} title={data.terbit ? '' : 'Terbitkan pengumuman terlebih dahulu'} onClick={() => setCetak(true)}>
          Cetak Hasil
        </Btn>
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
              {['No. Pendaftaran', 'Nama', 'Jalur', 'Status Kelulusan', 'Pemberitahuan', ''].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {data.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-navy/40">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {data.data.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-mono text-xs">{r.nomor_pendaftaran}</td>
                <td className="px-3 py-2 font-semibold text-navy">{r.nama_lengkap}</td>
                <td className="px-3 py-2">{r.jalur}</td>
                <td className="px-3 py-2">
                  <Badge tone={r.kelulusan === 'lolos' ? 'hijau' : r.kelulusan === 'belum' ? 'kuning' : 'merah'}>{r.kelulusan_label}</Badge>
                  {r.keterangan && <p className="text-[10px] text-navy/40 mt-0.5">{r.keterangan}</p>}
                </td>
                <td className="px-3 py-2 text-xs text-navy/60">{r.pemberitahuan_hasil_at ? `Disiapkan ${waktu(r.pemberitahuan_hasil_at)}` : '-'}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                  <Btn kecil disabled={!data.terbit} onClick={() => api.ppdbSuratHasil(r.id, `surat-hasil-${r.nomor_pendaftaran}.pdf`).catch((e) => setError(e.message))}>
                    Surat
                  </Btn>
                  <Btn
                    kecil
                    disabled={!data.terbit}
                    onClick={async () => {
                      try {
                        setNotif({ nama: r.nama_lengkap, hasil: await api.ppdbNotifikasiHasil(r.id) })
                        muat()
                      } catch (e) {
                        setError(e.message)
                      }
                    }}
                  >
                    Beritahu
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cetak && <CetakHasil data={data} baris={data.data} filter={filter.status} onClose={() => setCetak(false)} />}
      {notif && <ModalPesan judul={`Pemberitahuan — ${notif.nama}`} hasil={notif.hasil} onClose={() => setNotif(null)} />}
    </div>
  )
}
