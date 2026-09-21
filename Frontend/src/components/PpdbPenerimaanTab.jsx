import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, Kartu, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { selectClass, tgl } from './ppdbKonstanta'

const AKHIR_TONE = { belum: 'kuning', diterima: 'biru', diimpor: 'hijau' }
const AKHIR_LABEL = { belum: 'Menunggu konfirmasi', diterima: 'Diterima (belum diimpor)', diimpor: 'Sudah jadi siswa' }

function ModalTerima({ ids, data, onClose, onSimpan }) {
  const [tahun, setTahun] = useState(data.tahun_masuk_default)
  const [mode, setMode] = useState(data.kelas.length ? 'otomatis' : 'tanpa')
  const [kelasId, setKelasId] = useState('')
  const [kelasIds, setKelasIds] = useState(() => data.kelas.map((k) => k.id))
  const [error, setError] = useState('')
  const [sibuk, setSibuk] = useState(false)

  const kapasitasTersedia = useMemo(() => {
    const pilih = mode === 'manual' ? data.kelas.filter((k) => String(k.id) === String(kelasId)) : mode === 'otomatis' ? data.kelas.filter((k) => kelasIds.includes(k.id)) : []
    return pilih.some((k) => k.sisa === null) ? null : pilih.reduce((a, k) => a + k.sisa, 0)
  }, [mode, kelasId, kelasIds, data.kelas])

  async function kirim() {
    setSibuk(true)
    setError('')
    try {
      await onSimpan({
        ids,
        tahun_masuk: Number(tahun),
        penempatan: mode,
        ...(mode === 'manual' ? { kelas_id: Number(kelasId) } : {}),
        ...(mode === 'otomatis' ? { kelas_ids: kelasIds } : {}),
      })
    } catch (e) {
      setError(e.message)
      setSibuk(false)
    }
  }

  return (
    <ModalShell
      title={`Konfirmasi Penerimaan (${ids.length} peserta)`}
      onClose={onClose}
      lebar="max-w-xl"
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={sibuk || (mode === 'manual' && !kelasId) || (mode === 'otomatis' && kelasIds.length === 0)} onClick={kirim}>
            {sibuk ? 'Memproses…' : 'Konfirmasi Diterima'}
          </Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="space-y-4">
        <Field label="Tahun masuk" hint="Dipakai sebagai awalan NIS (contoh: 20260001) dan tahun masuk pada Data Siswa.">
          <input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-40" />
        </Field>
        <div>
          <p className="text-xs font-bold text-navy mb-2">Penempatan kelas / rombel</p>
          <div className="space-y-2">
            {[
              ['otomatis', 'Otomatis — isi rombel terpilih berurutan sampai kapasitas'],
              ['manual', 'Semua ke satu rombel'],
              ['tanpa', 'Tanpa penempatan (tentukan nanti di Data Siswa)'],
            ].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-navy">
                <input type="radio" name="penempatan" checked={mode === k} onChange={() => setMode(k)} />
                {l}
              </label>
            ))}
          </div>
        </div>

        {mode === 'manual' && (
          <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className={`${selectClass} w-full`}>
            <option value="">Pilih rombel</option>
            {data.kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas} — sisa {k.sisa === null ? 'tanpa batas' : k.sisa}
              </option>
            ))}
          </select>
        )}
        {mode === 'otomatis' && (
          <div className="space-y-1.5">
            {data.kelas.length === 0 && <p className="text-xs text-amber-700">Belum ada rombel aktif pada tahun ajaran PPDB ini. Buat di menu Kelas & Rombel.</p>}
            {data.kelas.map((k) => (
              <label key={k.id} className="flex items-center gap-2 text-sm text-navy border border-navy/10 rounded-lg px-3 py-1.5">
                <input type="checkbox" checked={kelasIds.includes(k.id)} onChange={(e) => setKelasIds((x) => (e.target.checked ? [...x, k.id] : x.filter((i) => i !== k.id)))} />
                <span className="flex-1">{k.nama_kelas}</span>
                <span className="text-xs text-navy/50">
                  {k.terisi}/{k.kapasitas ?? '∞'} terisi · sisa {k.sisa ?? 'tanpa batas'}
                </span>
              </label>
            ))}
          </div>
        )}
        {mode !== 'tanpa' && kapasitasTersedia !== null && (
          <p className={`text-xs ${kapasitasTersedia < ids.length ? 'text-red-600 font-semibold' : 'text-navy/50'}`}>
            Kapasitas tersedia {kapasitasTersedia} untuk {ids.length} peserta.
          </p>
        )}
      </div>
    </ModalShell>
  )
}

export default function PpdbPenerimaanTab({ periode, onBerubah }) {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState({ status: '', search: '' })
  const [pilih, setPilih] = useState([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [terima, setTerima] = useState(null)
  const [riwayat, setRiwayat] = useState(null)
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(
    () =>
      api
        .ppdbPenerimaan({ periode_id: periode.id, ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)) })
        .then((r) => {
          setData(r)
          setPilih([])
        })
        .catch((e) => setError(e.message)),
    [periode.id, filter],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  if (!data) return <Kosong>{error || 'Memuat…'}</Kosong>

  const r = data.ringkasan
  const terpilih = data.data.filter((b) => pilih.includes(b.id))
  const idsBelum = terpilih.filter((b) => b.status_akhir === 'belum').map((b) => b.id)
  const idsDiterima = terpilih.filter((b) => b.status_akhir === 'diterima').map((b) => b.id)
  const semuaDipilih = data.data.length > 0 && pilih.length === data.data.length

  async function aksi(fn, ids) {
    setSibuk(true)
    setError('')
    setInfo('')
    try {
      const res = await fn({ periode_id: periode.id, ids })
      const gagal = res.gagal?.length ? ` Gagal: ${res.gagal.map((g) => `${g.nama} (${g.alasan})`).join('; ')}` : ''
      setInfo(`${res.message}${gagal}`)
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
      <p className="text-xs text-navy/50">Peserta yang lolos seleksi dan sudah daftar ulang muncul di sini. Alurnya: konfirmasi penerimaan (NIS & rombel) → import ke Data Siswa.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kartu label="Layak Diterima" nilai={r.layak} sub="lolos + sudah daftar ulang" tone="hijau" />
        <Kartu label="Menunggu Konfirmasi" nilai={r.belum} tone="oranye" />
        <Kartu label="Sudah Diterima" nilai={r.diterima} tone="biru" />
        <Kartu label="Sudah Jadi Siswa" nilai={r.diimpor} tone="teal" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} placeholder="Cari nama / nomor…" className={`${selectClass} w-56`} />
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className={selectClass}>
          <option value="">Semua status</option>
          <option value="belum">Menunggu konfirmasi</option>
          <option value="diterima">Diterima (belum diimpor)</option>
          <option value="diimpor">Sudah jadi siswa</option>
        </select>
        <span className="flex-1" />
        <Btn utama disabled={idsBelum.length === 0 || sibuk} onClick={() => setTerima(idsBelum)}>
          Konfirmasi Penerimaan ({idsBelum.length})
        </Btn>
        <Btn utama disabled={idsDiterima.length === 0 || sibuk} onClick={() => aksi(api.ppdbImport, idsDiterima)}>
          Import ke Data Siswa ({idsDiterima.length})
        </Btn>
        <Btn bahaya disabled={idsDiterima.length === 0 || sibuk} onClick={() => window.confirm('Batalkan konfirmasi penerimaan (NIS & rombel dilepas)?') && aksi(api.ppdbBatalTerima, idsDiterima)}>
          Batalkan Konfirmasi
        </Btn>
        <Btn
          onClick={async () => {
            setRiwayat(riwayat ? null : await api.ppdbRiwayatPenerimaan(periode.id).catch((e) => (setError(e.message), [])))
          }}
        >
          {riwayat ? 'Sembunyikan Riwayat' : 'Riwayat Penerimaan'}
        </Btn>
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
              <th className="px-3 py-2">
                <input type="checkbox" checked={semuaDipilih} onChange={(e) => setPilih(e.target.checked ? data.data.map((b) => b.id) : [])} />
              </th>
              {['No. Pendaftaran', 'Nama', 'Jalur', 'Daftar Ulang', 'Status Penerimaan', 'NIS', 'Tahun Masuk', 'Rombel'].map((h) => (
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
                  Belum ada peserta yang lolos dan sudah daftar ulang.
                </td>
              </tr>
            )}
            {data.data.map((b) => (
              <tr key={b.id} className="hover:bg-navy/[0.02]">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={pilih.includes(b.id)} onChange={(e) => setPilih((x) => (e.target.checked ? [...x, b.id] : x.filter((i) => i !== b.id)))} />
                </td>
                <td className="px-3 py-2 font-mono text-xs">{b.nomor_pendaftaran}</td>
                <td className="px-3 py-2 font-semibold text-navy">{b.nama_lengkap}</td>
                <td className="px-3 py-2">{b.jalur}</td>
                <td className="px-3 py-2 text-xs text-navy/60">{tgl(b.tanggal_daftar_ulang)}</td>
                <td className="px-3 py-2">
                  <Badge tone={AKHIR_TONE[b.status_akhir]}>{AKHIR_LABEL[b.status_akhir]}</Badge>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{b.nis_terbit ?? '-'}</td>
                <td className="px-3 py-2">{b.tahun_masuk_terbit ?? '-'}</td>
                <td className="px-3 py-2">{b.kelas ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {riwayat && (
        <section className="bg-white border border-navy/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-navy mb-3">Riwayat Penerimaan</h3>
          <RiwayatList items={riwayat} />
        </section>
      )}

      {terima && (
        <ModalTerima
          ids={terima}
          data={data}
          onClose={() => setTerima(null)}
          onSimpan={async (payload) => {
            const res = await api.ppdbTerima({ periode_id: periode.id, ...payload })
            setTerima(null)
            setInfo(res.message)
            await muat()
            onBerubah?.()
          }}
        />
      )}
    </div>
  )
}
