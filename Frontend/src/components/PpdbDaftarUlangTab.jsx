import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, Kartu, Kosong, ModalPesan, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { TONE_DAFTAR_ULANG, selectClass, tgl, waktu } from './ppdbKonstanta'

function ModalKonfirmasi({ baris, terlambat, onClose, onSimpan }) {
  const [cek, setCek] = useState(() => Object.fromEntries(baris.persyaratan.map((r) => [r.id, r.terpenuhi])))
  const [catatan, setCatatan] = useState(baris.catatan ?? '')
  const [izin, setIzin] = useState(false)
  const [error, setError] = useState('')
  const [sibuk, setSibuk] = useState(false)

  async function kirim() {
    setSibuk(true)
    setError('')
    try {
      await onSimpan({ checklist: cek, catatan: catatan || null, izinkan_terlambat: izin })
    } catch (e) {
      setError(e.message)
      setSibuk(false)
    }
  }

  return (
    <ModalShell
      title={`Konfirmasi Daftar Ulang — ${baris.nama_lengkap}`}
      onClose={onClose}
      lebar="max-w-lg"
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={sibuk} onClick={kirim}>
            {sibuk ? 'Menyimpan…' : 'Konfirmasi Daftar Ulang'}
          </Btn>
        </>
      }
    >
      <Pesan error={error} />
      <p className="text-xs font-bold text-navy mb-2">Checklist dokumen daftar ulang</p>
      {baris.persyaratan.length === 0 && <p className="text-xs text-navy/40 mb-2">Belum ada persyaratan daftar ulang di Pengaturan.</p>}
      <div className="space-y-2 mb-3">
        {baris.persyaratan.map((r) => (
          <label key={r.id} className="flex items-center gap-2 text-sm text-navy border border-navy/10 rounded-lg px-3 py-2">
            <input type="checkbox" checked={Boolean(cek[r.id])} onChange={(e) => setCek((x) => ({ ...x, [r.id]: e.target.checked }))} />
            {r.nama}
            {r.wajib ? <span className="text-red-500">*</span> : <span className="text-[10px] text-navy/40">(opsional)</span>}
          </label>
        ))}
      </div>
      <Field label="Catatan">
        <textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-full" />
      </Field>
      {terlambat && (
        <label className="flex items-center gap-2 text-sm text-red-700 mt-3">
          <input type="checkbox" checked={izin} onChange={(e) => setIzin(e.target.checked)} />
          Batas waktu daftar ulang sudah lewat — tetap terima daftar ulang terlambat
        </label>
      )}
    </ModalShell>
  )
}

export default function PpdbDaftarUlangTab({ periode, onBerubah }) {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState({ status: '', jalur_id: '', search: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [konfirmasi, setKonfirmasi] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [riwayat, setRiwayat] = useState(null)

  const muat = useCallback(
    () =>
      api
        .ppdbDaftarUlang({ periode_id: periode.id, ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)) })
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
      await fn()
      setInfo(sukses)
      await muat()
      onBerubah?.()
    } catch (e) {
      setError(e.message)
    }
  }

  const r = data.ringkasan
  const kunci = !data.terbit

  return (
    <div className="space-y-4">
      <Pesan error={error} info={info} />
      {kunci && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">Daftar ulang baru dapat diproses setelah pengumuman hasil seleksi diterbitkan.</p>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kartu label="Peserta Lolos" nilai={r.lolos} tone="hijau" />
        <Kartu label="Sudah Daftar Ulang" nilai={r.sudah} tone="teal" />
        <Kartu label="Belum Daftar Ulang" nilai={r.belum} tone="oranye" />
        <Kartu label="Dibatalkan" nilai={r.dibatalkan} tone="merah" />
        <div className={`rounded-2xl border p-4 ${data.terlambat ? 'border-red-200 bg-red-50' : 'border-navy/10 bg-white'}`}>
          <p className="text-xs text-navy/60">Batas Waktu Daftar Ulang</p>
          <p className="text-lg font-extrabold text-navy mt-1 leading-none">{data.batas ? tgl(data.batas) : 'Belum diatur'}</p>
          <p className={`text-[11px] mt-1.5 ${data.terlambat ? 'text-red-600 font-semibold' : 'text-navy/40'}`}>
            {data.batas ? (data.terlambat ? `Terlambat ${Math.abs(data.sisa_hari)} hari` : data.sisa_hari === 0 ? 'Hari ini terakhir' : `${data.sisa_hari} hari lagi`) : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} placeholder="Cari nama / nomor…" className={`${selectClass} w-56`} />
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className={selectClass}>
          <option value="">Semua status</option>
          <option value="belum">Belum daftar ulang</option>
          <option value="sudah">Sudah daftar ulang</option>
          <option value="dibatalkan">Dibatalkan</option>
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
        <Btn
          onClick={async () => {
            setRiwayat(riwayat ? null : await api.ppdbRiwayatDaftarUlang(periode.id).catch((e) => (setError(e.message), [])))
          }}
        >
          {riwayat ? 'Sembunyikan Riwayat' : 'Riwayat Daftar Ulang'}
        </Btn>
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
              {['No. Pendaftaran', 'Nama', 'Status Kelulusan', 'Kelengkapan Dokumen', 'Status Daftar Ulang', 'Tanggal / Petugas', 'Catatan', ''].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {data.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-xs text-navy/40">
                  Belum ada peserta lolos.
                </td>
              </tr>
            )}
            {data.data.map((b) => (
              <tr key={b.id} className="align-top">
                <td className="px-3 py-2 font-mono text-xs">{b.nomor_pendaftaran}</td>
                <td className="px-3 py-2">
                  <p className="font-semibold text-navy">{b.nama_lengkap}</p>
                  <p className="text-[11px] text-navy/40">{b.jalur}</p>
                </td>
                <td className="px-3 py-2">
                  <Badge tone="hijau">{b.status_seleksi_label}</Badge>
                </td>
                <td className="px-3 py-2 text-xs">{b.kelengkapan.total ? `${b.kelengkapan.terpenuhi} / ${b.kelengkapan.total}` : '-'}</td>
                <td className="px-3 py-2">
                  <Badge tone={TONE_DAFTAR_ULANG[b.status_daftar_ulang]}>{b.status_daftar_ulang_label}</Badge>
                  {b.diterima && <p className="text-[10px] text-navy/40 mt-0.5">sudah diterima</p>}
                </td>
                <td className="px-3 py-2 text-xs text-navy/60">
                  {b.tanggal_daftar_ulang ? waktu(b.tanggal_daftar_ulang) : '-'}
                  {b.petugas && <p>oleh {b.petugas}</p>}
                </td>
                <td className="px-3 py-2 text-xs text-navy/60 max-w-48">{b.catatan || '-'}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                  {b.status_daftar_ulang === 'belum' && (
                    <>
                      <Btn kecil utama disabled={kunci} onClick={() => setKonfirmasi(b)}>
                        Konfirmasi
                      </Btn>
                      <Btn
                        kecil
                        disabled={kunci}
                        onClick={async () => {
                          try {
                            setPesan({ judul: `Pengingat — ${b.nama_lengkap}`, hasil: await api.ppdbPengingatDaftarUlang(b.id) })
                          } catch (e) {
                            setError(e.message)
                          }
                        }}
                      >
                        Ingatkan
                      </Btn>
                    </>
                  )}
                  {b.status_daftar_ulang !== 'dibatalkan' && (
                    <Btn
                      kecil
                      bahaya
                      disabled={kunci || b.diterima}
                      onClick={() => {
                        const c = window.prompt('Alasan pembatalan daftar ulang (kursi akan dilepas):')
                        if (c) jalankan(() => api.ppdbBatalDaftarUlang(b.id, c), 'Daftar ulang dibatalkan.')
                      }}
                    >
                      Batalkan
                    </Btn>
                  )}
                  {b.status_daftar_ulang === 'dibatalkan' && (
                    <Btn kecil disabled={kunci} onClick={() => jalankan(() => api.ppdbBukaKembaliDaftarUlang(b.id), 'Status kembali menjadi belum daftar ulang.')}>
                      Buka Kembali
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {riwayat && (
        <section className="bg-white border border-navy/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-navy mb-3">Riwayat Daftar Ulang</h3>
          <RiwayatList items={riwayat} />
        </section>
      )}

      {konfirmasi && (
        <ModalKonfirmasi
          baris={konfirmasi}
          terlambat={data.terlambat}
          onClose={() => setKonfirmasi(null)}
          onSimpan={async (payload) => {
            await api.ppdbKonfirmasiDaftarUlang(konfirmasi.id, payload)
            setKonfirmasi(null)
            setInfo('Daftar ulang dikonfirmasi.')
            await muat()
            onBerubah?.()
          }}
        />
      )}
      {pesan && <ModalPesan judul={pesan.judul} hasil={pesan.hasil} onClose={() => setPesan(null)} />}
    </div>
  )
}
