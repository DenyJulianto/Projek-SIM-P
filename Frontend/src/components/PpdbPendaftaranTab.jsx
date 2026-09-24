import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { PendaftarDetailModal, PendaftarFormModal } from './PpdbPendaftarModals'
import { Badge, Btn, Kosong, Pesan } from './PpdbUI'
import { TONE_DAFTAR_ULANG, TONE_SELEKSI, TONE_VERIFIKASI, selectClass, tgl } from './ppdbKonstanta'

const FILTER_AWAL = { jalur_id: '', status_pendaftaran: '', status_verifikasi: '', status_seleksi: '', status_daftar_ulang: '', jenis_kelamin: '', sekolah_asal: '', search: '' }

/**
 * Tab Pendaftaran (semua pendaftar, tambah/edit/dokumen/bukti) dan tab Verifikasi
 * (antrean pemeriksaan) memakai daftar yang sama; bedanya filter awal dan aksi utama.
 */
export default function PpdbPendaftaranTab({ periode, mode = 'pendaftaran', onBerubah }) {
  const verifikasi = mode === 'verifikasi'
  const [filter, setFilter] = useState({ ...FILTER_AWAL, ...(verifikasi ? { status_verifikasi: 'belum', status_pendaftaran: 'terdaftar' } : {}) })
  const [halaman, setHalaman] = useState(1)
  const [data, setData] = useState(null)
  const [asal, setAsal] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(false)
  const [detail, setDetail] = useState(null)
  const [ringkas, setRingkas] = useState(null)

  const muat = useCallback(() => {
    const params = { periode_id: periode.id, page: halaman, per_page: 20, ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v !== '')) }
    return api
      .ppdbListPendaftar(params)
      .then((r) => {
        setData(r)
        setError('')
      })
      .catch((e) => setError(e.message))
  }, [periode.id, filter, halaman])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])
  useEffect(() => {
    api.ppdbAsalSekolah(periode.id).then(setAsal).catch(() => {})
  }, [periode.id, data?.total])
  useEffect(() => {
    if (!verifikasi) return
    Promise.all(['belum', 'perlu_perbaikan', 'diverifikasi', 'ditolak'].map((s) => api.ppdbListPendaftar({ periode_id: periode.id, status_pendaftaran: 'terdaftar', status_verifikasi: s, per_page: 1 }).then((r) => [s, r.total]))).then((x) => setRingkas(Object.fromEntries(x))).catch(() => {})
  }, [periode.id, verifikasi, data])

  const set = (k, v) => {
    setHalaman(1)
    setFilter((f) => ({ ...f, [k]: v }))
  }
  const dibuka = periode.status === 'dibuka'
  const aktifFilter = Object.values(filter).some((v) => v !== '')

  return (
    <div>
      <Pesan error={error} />

      {verifikasi && ringkas && (
        <div className="flex gap-2 flex-wrap mb-3">
          {[
            ['belum', 'Belum diverifikasi', 'abu'],
            ['perlu_perbaikan', 'Perlu perbaikan', 'kuning'],
            ['diverifikasi', 'Terverifikasi', 'hijau'],
            ['ditolak', 'Ditolak', 'merah'],
          ].map(([k, l, tone]) => (
            <button key={k} onClick={() => set('status_verifikasi', filter.status_verifikasi === k ? '' : k)} className={`rounded-xl border px-4 py-2 text-left ${filter.status_verifikasi === k ? 'border-navy bg-navy/5' : 'border-navy/10 bg-white'}`}>
              <p className="text-[11px] text-navy/50">{l}</p>
              <p className="text-xl font-extrabold text-navy leading-none mt-0.5">
                {ringkas[k]} <Badge tone={tone}>●</Badge>
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <input value={filter.search} onChange={(e) => set('search', e.target.value)} placeholder="Cari nama, no. pendaftaran, NIK, NISN…" className={`${selectClass} w-64`} />
        <select value={filter.jalur_id} onChange={(e) => set('jalur_id', e.target.value)} className={selectClass}>
          <option value="">Semua jalur</option>
          {periode.jalur.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama}
            </option>
          ))}
        </select>
        {!verifikasi && (
          <select value={filter.status_pendaftaran} onChange={(e) => set('status_pendaftaran', e.target.value)} className={selectClass}>
            <option value="">Semua status pendaftaran</option>
            <option value="terdaftar">Terdaftar</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        )}
        <select value={filter.status_verifikasi} onChange={(e) => set('status_verifikasi', e.target.value)} className={selectClass}>
          <option value="">Semua status verifikasi</option>
          <option value="belum">Belum diverifikasi</option>
          <option value="perlu_perbaikan">Perlu perbaikan</option>
          <option value="diverifikasi">Terverifikasi</option>
          <option value="ditolak">Ditolak</option>
        </select>
        <select value={filter.status_seleksi} onChange={(e) => set('status_seleksi', e.target.value)} className={selectClass}>
          <option value="">Semua status seleksi</option>
          <option value="belum">Belum diputuskan</option>
          <option value="lolos">Lolos</option>
          <option value="tidak_lolos">Tidak lolos</option>
        </select>
        <select value={filter.status_daftar_ulang} onChange={(e) => set('status_daftar_ulang', e.target.value)} className={selectClass}>
          <option value="">Semua status daftar ulang</option>
          <option value="belum">Belum daftar ulang</option>
          <option value="sudah">Sudah daftar ulang</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
        <select value={filter.jenis_kelamin} onChange={(e) => set('jenis_kelamin', e.target.value)} className={selectClass}>
          <option value="">L/P</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
        <select value={filter.sekolah_asal} onChange={(e) => set('sekolah_asal', e.target.value)} className={`${selectClass} max-w-48`}>
          <option value="">Semua asal sekolah</option>
          {asal.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {aktifFilter && (
          <button onClick={() => {
              setHalaman(1)
              setFilter({ ...FILTER_AWAL })
            }} className="text-xs font-semibold text-navy/60 hover:text-navy">
            Reset
          </button>
        )}
        <span className="flex-1" />
        {!verifikasi && (
          <Btn utama disabled={!dibuka} title={dibuka ? '' : 'Pendaftaran hanya dapat ditambah saat status PPDB “Pendaftaran Dibuka”'} onClick={() => setForm(true)}>
            + Tambah Pendaftar
          </Btn>
        )}
      </div>
      {!verifikasi && !dibuka && <p className="text-xs text-amber-700 mb-3">Status PPDB saat ini “{periode.status_label}” — pendaftar baru hanya dapat ditambahkan ketika pendaftaran dibuka (atur di tab Pengaturan).</p>}

      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                {['No. Pendaftaran', 'Nama', 'Jalur', 'Asal Sekolah', 'Dokumen', 'Verifikasi', 'Seleksi', 'Daftar Ulang', ''].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-xs text-navy/40">
                    Tidak ada pendaftar yang sesuai.
                  </td>
                </tr>
              )}
              {data.data.map((r) => (
                <tr key={r.id} className={`hover:bg-navy/[0.02] ${r.status_pendaftaran === 'dibatalkan' ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.nomor_pendaftaran}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-navy">{r.nama_lengkap}</p>
                    <p className="text-[11px] text-navy/40">
                      {r.jenis_kelamin === 'L' ? 'L' : 'P'} · {tgl(r.created_at)}
                      {r.status_pendaftaran === 'dibatalkan' ? ' · dibatalkan' : ''}
                    </p>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.jalur}</td>
                  <td className="px-3 py-2">{r.sekolah_asal || '-'}</td>
                  <td className="px-3 py-2 text-center">{r.dokumen_count}</td>
                  <td className="px-3 py-2">
                    <Badge tone={TONE_VERIFIKASI[r.status_verifikasi]}>{r.status_verifikasi_label}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={TONE_SELEKSI[r.status_seleksi]}>{r.status_seleksi_label}</Badge>
                  </td>
                  <td className="px-3 py-2">{r.status_seleksi === 'lolos' ? <Badge tone={TONE_DAFTAR_ULANG[r.status_daftar_ulang]}>{r.status_daftar_ulang_label}</Badge> : <span className="text-navy/30">-</span>}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                    <Btn kecil utama={verifikasi} onClick={() => setDetail({ id: r.id, fokus: verifikasi ? 'verifikasi' : 'data' })}>
                      {verifikasi ? 'Verifikasi' : 'Detail'}
                    </Btn>
                    {!verifikasi && (
                      <Btn kecil onClick={() => api.ppdbBukti(r.id, `bukti-${r.nomor_pendaftaran}.pdf`).catch((e) => setError(e.message))}>
                        Bukti
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-3 py-2 border-t border-navy/5 text-xs text-navy/50">
            <span>{data.total} pendaftar</span>
            <div className="flex items-center gap-2">
              <Btn kecil disabled={data.current_page <= 1} onClick={() => setHalaman((h) => h - 1)}>
                ‹
              </Btn>
              <span>
                {data.current_page} / {data.last_page}
              </span>
              <Btn kecil disabled={data.current_page >= data.last_page} onClick={() => setHalaman((h) => h + 1)}>
                ›
              </Btn>
            </div>
          </div>
        </div>
      )}

      {form && (
        <PendaftarFormModal
          periode={periode}
          onClose={() => setForm(false)}
          onSaved={(baru) => {
            setForm(false)
            muat()
            onBerubah?.()
            setDetail({ id: baru.id, fokus: 'dokumen' })
          }}
        />
      )}
      {detail && (
        <PendaftarDetailModal
          key={`${detail.id}-${detail.fokus}`}
          id={detail.id}
          fokus={detail.fokus}
          periode={periode}
          onClose={() => setDetail(null)}
          onChanged={() => {
            muat()
            onBerubah?.()
          }}
        />
      )}
    </div>
  )
}
