import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { PendaftarDetailModal } from './PpdbPendaftarModals'
import { Badge, Btn, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { TONE_SELEKSI } from './ppdbKonstanta'

function InputNilai({ nilai, maks, disabled, onSimpan }) {
  const [v, setV] = useState(nilai ?? '')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setV(nilai ?? '')
  }, [nilai])
  return (
    <input
      type="number"
      min="0"
      max={maks}
      step="any"
      disabled={disabled}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => String(v) !== String(nilai ?? '') && onSimpan(v)}
      className="w-20 border border-navy/15 rounded-lg px-2 py-1 text-sm text-right disabled:bg-navy/5"
    />
  )
}

function ModalProses({ hasil, onClose, onSimpan, sibuk, terkunci }) {
  return (
    <ModalShell
      title="Hasil Perhitungan Seleksi (pratinjau)"
      onClose={onClose}
      lebar="max-w-4xl"
      footer={
        <>
          <Btn onClick={onClose}>Tutup</Btn>
          <Btn utama disabled={sibuk || terkunci || hasil.berubah === 0} onClick={onSimpan}>
            {sibuk ? 'Menyimpan…' : `Simpan Hasil Seleksi (${hasil.berubah} perubahan)`}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        {[
          ['Diproses', hasil.jumlah],
          ['Lolos', hasil.lolos],
          ['Tidak lolos', hasil.tidak_lolos],
        ].map(([l, n]) => (
          <div key={l} className="bg-navy/5 rounded-xl py-2">
            <p className="text-[11px] text-navy/50">{l}</p>
            <p className="text-xl font-extrabold text-navy">{n}</p>
          </div>
        ))}
      </div>
      {hasil.peringatan.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-3 space-y-1">
          {hasil.peringatan.map((p) => (
            <p key={p} className="text-xs text-amber-800">
              {p}
            </p>
          ))}
        </div>
      )}
      <p className="text-xs text-navy/50 mb-2">Ini baru usulan. Hasil tidak berubah sebelum Anda menekan “Simpan Hasil Seleksi”. Yang sudah daftar ulang/diterima tidak diubah.</p>
      <div className="border border-navy/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
              {['#', 'Nama', 'Jalur', 'Skor', 'Hasil Usulan', 'Alasan', 'Perubahan'].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {hasil.hasil.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-xs text-navy/40">
                  Tidak ada peserta yang dapat diproses (pastikan sudah terverifikasi dan nilai seleksi lengkap).
                </td>
              </tr>
            )}
            {hasil.hasil.map((h) => (
              <tr key={h.id}>
                <td className="px-3 py-2">{h.peringkat}</td>
                <td className="px-3 py-2">
                  <p className="font-semibold text-navy">{h.nama_lengkap}</p>
                  <p className="text-[11px] text-navy/40">{h.nomor_pendaftaran}</p>
                </td>
                <td className="px-3 py-2">{h.jalur}</td>
                <td className="px-3 py-2 font-semibold">{h.skor}</td>
                <td className="px-3 py-2">
                  <Badge tone={h.status_baru === 'lolos' ? 'hijau' : 'merah'}>{h.status_baru === 'lolos' ? 'Lolos' : 'Tidak lolos'}</Badge>
                </td>
                <td className="px-3 py-2 text-xs text-navy/60">{h.alasan}</td>
                <td className="px-3 py-2 text-xs">{h.berubah ? <span className="text-amber-700 font-semibold">berubah dari “{h.status_lama === 'belum' ? 'belum' : h.status_lama.replace('_', ' ')}”</span> : <span className="text-navy/30">tetap</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModalShell>
  )
}

export default function PpdbSeleksiTab({ periode, onBerubah }) {
  const [data, setData] = useState(null)
  const [jalurId, setJalurId] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [proses, setProses] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [detail, setDetail] = useState(null)
  const [riwayat, setRiwayat] = useState(null)

  const muat = useCallback(
    () =>
      api
        .ppdbSeleksi({ periode_id: periode.id })
        .then((r) => {
          setData(r)
          setJalurId((j) => j || String(r.jalur[0]?.id ?? ''))
        })
        .catch((e) => setError(e.message)),
    [periode.id],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  if (!data) return <Kosong>{error || 'Memuat…'}</Kosong>
  const jalur = data.jalur.find((j) => String(j.id) === jalurId) ?? data.jalur[0]
  if (!jalur) return <Kosong>Belum ada jalur. Atur di tab Pengaturan.</Kosong>
  const terkunci = data.pengumuman_terbit

  async function jalankan(fn, sukses) {
    setError('')
    setInfo('')
    try {
      await fn()
      if (sukses) setInfo(sukses)
      await muat()
      onBerubah?.()
    } catch (e) {
      setError(e.message)
    }
  }

  async function tandai(p, status) {
    setError('')
    setInfo('')
    let catatan = null
    if (status === 'tidak_lolos') catatan = window.prompt('Catatan (opsional):') || null
    try {
      await api.ppdbSeleksiTandai(p.id, { status, catatan })
    } catch (e) {
      if (String(e.message).includes('Konfirmasi untuk tetap') && window.confirm(`${e.message}\n\nLanjutkan meloloskan melebihi kuota?`)) {
        try {
          await api.ppdbSeleksiTandai(p.id, { status, catatan, izinkan_melebihi_kuota: true })
        } catch (e2) {
          setError(e2.message)
          return
        }
      } else {
        setError(e.message)
        return
      }
    }
    await muat()
    onBerubah?.()
  }

  async function hitung(semua) {
    setSibuk(true)
    setError('')
    try {
      setProses({ ...(await api.ppdbSeleksiProses({ periode_id: periode.id, ...(semua ? {} : { jalur_id: jalur.id }) })), semua })
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk(false)
    }
  }

  async function simpan() {
    setSibuk(true)
    try {
      const r = await api.ppdbSeleksiProses({ periode_id: periode.id, simpan: true, ...(proses.semua ? {} : { jalur_id: jalur.id }) })
      setProses(null)
      setInfo(`Hasil seleksi disimpan (${r.berubah} perubahan).`)
      await muat()
      onBerubah?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="space-y-4">
      <Pesan error={error} info={info} />
      {terkunci && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">Pengumuman sudah terbit — hasil seleksi terkunci. Batalkan publikasi di tab Pengumuman untuk mengubahnya.</p>}
      {data.belum_diverifikasi > 0 && <p className="text-xs text-navy/60 bg-navy/5 rounded-xl px-4 py-2">{data.belum_diverifikasi} pendaftar belum terverifikasi dan belum ikut seleksi. Selesaikan di tab Verifikasi.</p>}

      <div className="flex items-center gap-2 flex-wrap">
        {data.jalur.map((j) => (
          <button key={j.id} onClick={() => setJalurId(String(j.id))} className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${String(j.id) === String(jalur.id) ? 'bg-navy text-white border-navy' : 'border-navy/20 text-navy hover:bg-navy/5'} ${j.aktif ? '' : 'opacity-50'}`}>
            {j.nama}
            <span className="ml-1.5 text-[11px] opacity-70">
              {j.terisi}/{j.kuota}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl p-4 grid sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-[11px] text-navy/50">Kuota jalur</p>
          <p className="text-lg font-extrabold text-navy">
            {jalur.terisi} <span className="text-sm font-semibold text-navy/40">/ {jalur.kuota} terisi</span>
          </p>
          <div className="h-1.5 bg-navy/10 rounded-full mt-1 overflow-hidden">
            <div className={`h-full ${jalur.terisi > jalur.kuota ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${jalur.kuota ? Math.min(100, (jalur.terisi / jalur.kuota) * 100) : 0}%` }} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className="text-[11px] text-navy/50">Kriteria seleksi (bobot · nilai maks)</p>
          <p className="font-semibold text-navy">{jalur.kriteria.length ? jalur.kriteria.map((c) => `${c.nama} (${c.bobot} · ${c.maks})`).join(', ') : 'Belum ada kriteria — hasil ditandai manual'}</p>
          <p className="text-[11px] text-navy/40">Nilai minimal lolos: {jalur.nilai_minimal ?? 'tidak ditentukan'}</p>
        </div>
        <div>
          <p className="text-[11px] text-navy/50">Peserta terverifikasi</p>
          <p className="text-lg font-extrabold text-navy">
            {jalur.peserta.length} <span className="text-sm font-semibold text-navy/40">dari {jalur.pendaftar}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Btn utama disabled={sibuk || terkunci || jalur.kriteria.length === 0} title={jalur.kriteria.length ? '' : 'Jalur belum memiliki kriteria'} onClick={() => hitung(false)}>
          Hitung Otomatis — {jalur.nama}
        </Btn>
        <Btn disabled={sibuk || terkunci} onClick={() => hitung(true)}>
          Hitung Semua Jalur
        </Btn>
        <span className="flex-1" />
        <Btn
          onClick={async () => {
            setRiwayat(riwayat ? null : await api.ppdbSeleksiRiwayat(periode.id).catch((e) => (setError(e.message), [])))
          }}
        >
          {riwayat ? 'Sembunyikan Riwayat' : 'Riwayat Perubahan Hasil'}
        </Btn>
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
              <th className="px-3 py-2 font-semibold">Rank</th>
              <th className="px-3 py-2 font-semibold">Peserta</th>
              {jalur.kriteria.map((c) => (
                <th key={c.nama} className="px-3 py-2 font-semibold whitespace-nowrap">
                  {c.nama} <span className="normal-case text-navy/40">/{c.maks}</span>
                </th>
              ))}
              <th className="px-3 py-2 font-semibold">Skor</th>
              <th className="px-3 py-2 font-semibold">Hasil</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {jalur.peserta.length === 0 && (
              <tr>
                <td colSpan={5 + jalur.kriteria.length} className="px-3 py-8 text-center text-xs text-navy/40">
                  Belum ada peserta terverifikasi pada jalur ini.
                </td>
              </tr>
            )}
            {jalur.peserta.map((p) => (
              <tr key={p.id} className="hover:bg-navy/[0.02]">
                <td className="px-3 py-2 font-bold text-navy">{p.peringkat ?? '-'}</td>
                <td className="px-3 py-2">
                  <button onClick={() => setDetail(p.id)} className="text-left">
                    <p className="font-semibold text-navy hover:underline">{p.nama_lengkap}</p>
                  </button>
                  <p className="text-[11px] text-navy/40">
                    {p.nomor_pendaftaran} · {p.sekolah_asal || '-'}
                  </p>
                </td>
                {jalur.kriteria.map((c) => (
                  <td key={c.nama} className="px-3 py-2">
                    <InputNilai
                      nilai={p.nilai_seleksi[c.nama]}
                      maks={c.maks}
                      disabled={terkunci || p.terkunci}
                      onSimpan={(v) =>
                        jalankan(() => api.ppdbSeleksiNilai(p.id, { ...p.nilai_seleksi, [c.nama]: v === '' ? null : Number(v) }))
                      }
                    />
                  </td>
                ))}
                <td className="px-3 py-2 font-bold">{p.skor ?? <span className="text-navy/30 font-normal text-xs">belum lengkap</span>}</td>
                <td className="px-3 py-2">
                  <Badge tone={TONE_SELEKSI[p.status_seleksi]}>{p.status_seleksi_label}</Badge>
                  {p.terkunci && <p className="text-[10px] text-navy/40 mt-0.5">terkunci (daftar ulang)</p>}
                  {p.catatan_seleksi && <p className="text-[10px] text-navy/40 mt-0.5 max-w-40 truncate" title={p.catatan_seleksi}>{p.catatan_seleksi}</p>}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                  <Btn kecil disabled={terkunci || p.terkunci || p.status_seleksi === 'lolos'} onClick={() => tandai(p, 'lolos')}>
                    Lolos
                  </Btn>
                  <Btn kecil bahaya disabled={terkunci || p.terkunci || p.status_seleksi === 'tidak_lolos'} onClick={() => tandai(p, 'tidak_lolos')}>
                    Tidak lolos
                  </Btn>
                  {p.status_seleksi !== 'belum' && (
                    <Btn kecil disabled={terkunci || p.terkunci} onClick={() => tandai(p, 'belum')}>
                      Reset
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-navy/40">Nilai tersimpan otomatis saat kolom ditinggalkan. Skor dihitung dari kriteria dan bobot yang Anda atur di Pengaturan; peserta dengan nilai belum lengkap tidak diberi peringkat.</p>

      {riwayat && (
        <section className="bg-white border border-navy/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-navy mb-3">Riwayat Perubahan Hasil Seleksi</h3>
          <RiwayatList items={riwayat} />
        </section>
      )}

      {proses && <ModalProses hasil={proses} sibuk={sibuk} terkunci={terkunci} onClose={() => setProses(null)} onSimpan={simpan} />}
      {detail && <PendaftarDetailModal id={detail} periode={periode} onClose={() => setDetail(null)} onChanged={muat} />}
    </div>
  )
}
