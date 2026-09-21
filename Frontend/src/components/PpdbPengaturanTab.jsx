import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, Kosong, ModalShell, Pesan } from './PpdbUI'
import { STATUS_PERIODE_TONE, tgl } from './ppdbKonstanta'

const SARAN_JALUR = ['Jalur Domisili', 'Jalur Afirmasi', 'Jalur Prestasi', 'Jalur Mutasi', 'Jalur Lainnya']
const input = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white'

const AKSI_STATUS = {
  draft: [['dibuka', 'Buka Pendaftaran']],
  dibuka: [
    ['ditutup', 'Tutup Pendaftaran'],
    ['seleksi', 'Mulai Seleksi'],
  ],
  ditutup: [
    ['dibuka', 'Buka Kembali'],
    ['seleksi', 'Mulai Seleksi'],
  ],
  seleksi: [['ditutup', 'Kembali ke Ditutup']],
  pengumuman: [['daftar_ulang', 'Buka Daftar Ulang']],
  daftar_ulang: [['selesai', 'Selesaikan PPDB']],
  selesai: [['daftar_ulang', 'Buka Kembali']],
}

const FORM_KOSONG = {
  tahun_ajaran_id: '',
  nama: '',
  jenjang: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  kuota: '',
  jumlah_rombel: '',
  kapasitas_rombel: '',
  jadwal_seleksi: '',
  jadwal_pengumuman: '',
  daftar_ulang_mulai: '',
  daftar_ulang_selesai: '',
  catatan: '',
}

function FormPeriode({ periode, opsi, onSimpan, onBatal }) {
  const [f, setF] = useState(() => (periode ? Object.fromEntries(Object.keys(FORM_KOSONG).map((k) => [k, periode[k] ?? ''])) : { ...FORM_KOSONG, jenjang: opsi.jenjang_sekolah ?? '', tahun_ajaran_id: opsi.tahun_ajaran.find((t) => t.is_active)?.id ?? '' }))
  const [error, setError] = useState('')
  const [simpan, setSimpan] = useState(false)
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const tampung = f.jumlah_rombel && f.kapasitas_rombel ? Number(f.jumlah_rombel) * Number(f.kapasitas_rombel) : null

  async function kirim(e) {
    e.preventDefault()
    setSimpan(true)
    setError('')
    const angka = (v) => (v === '' ? null : Number(v))
    const data = {
      ...f,
      tahun_ajaran_id: Number(f.tahun_ajaran_id),
      kuota: Number(f.kuota),
      jumlah_rombel: angka(f.jumlah_rombel),
      kapasitas_rombel: angka(f.kapasitas_rombel),
      ...Object.fromEntries(['jenjang', 'jadwal_seleksi', 'jadwal_pengumuman', 'daftar_ulang_mulai', 'daftar_ulang_selesai', 'catatan'].map((k) => [k, f[k] || null])),
    }
    try {
      await onSimpan(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSimpan(false)
    }
  }

  return (
    <form onSubmit={kirim} className="bg-white rounded-2xl border border-navy/10 p-5 space-y-4">
      <Pesan error={error} />
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Tahun Ajaran">
          <select required value={f.tahun_ajaran_id} onChange={(e) => u('tahun_ajaran_id', e.target.value)} className={input}>
            <option value="">Pilih tahun ajaran</option>
            {opsi.tahun_ajaran.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
                {t.is_active ? ' (aktif)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nama PPDB" className="sm:col-span-2">
          <input required value={f.nama} onChange={(e) => u('nama', e.target.value)} className={input} placeholder="PPDB Tahun Ajaran 2026/2027" />
        </Field>
        <Field label="Jenjang">
          <input value={f.jenjang} onChange={(e) => u('jenjang', e.target.value)} className={input} placeholder="mis. SMP" />
        </Field>
        <Field label="Tanggal mulai pendaftaran">
          <input required type="date" value={f.tanggal_mulai} onChange={(e) => u('tanggal_mulai', e.target.value)} className={input} />
        </Field>
        <Field label="Tanggal berakhir pendaftaran">
          <input required type="date" value={f.tanggal_selesai} onChange={(e) => u('tanggal_selesai', e.target.value)} className={input} />
        </Field>
        <Field label="Kuota penerimaan" hint={tampung ? `Daya tampung ${tampung} siswa` : undefined}>
          <input required type="number" min="1" value={f.kuota} onChange={(e) => u('kuota', e.target.value)} className={input} />
        </Field>
        <Field label="Jumlah rombel">
          <input type="number" min="1" value={f.jumlah_rombel} onChange={(e) => u('jumlah_rombel', e.target.value)} className={input} />
        </Field>
        <Field label="Kapasitas per rombel">
          <input type="number" min="1" value={f.kapasitas_rombel} onChange={(e) => u('kapasitas_rombel', e.target.value)} className={input} />
        </Field>
        <Field label="Jadwal seleksi">
          <input type="date" value={f.jadwal_seleksi} onChange={(e) => u('jadwal_seleksi', e.target.value)} className={input} />
        </Field>
        <Field label="Jadwal pengumuman">
          <input type="date" value={f.jadwal_pengumuman} onChange={(e) => u('jadwal_pengumuman', e.target.value)} className={input} />
        </Field>
        <span />
        <Field label="Daftar ulang mulai">
          <input type="date" value={f.daftar_ulang_mulai} onChange={(e) => u('daftar_ulang_mulai', e.target.value)} className={input} />
        </Field>
        <Field label="Daftar ulang berakhir (batas waktu)">
          <input type="date" value={f.daftar_ulang_selesai} onChange={(e) => u('daftar_ulang_selesai', e.target.value)} className={input} />
        </Field>
        <Field label="Catatan" className="sm:col-span-3">
          <textarea rows={2} value={f.catatan} onChange={(e) => u('catatan', e.target.value)} className={input} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        {onBatal && <Btn onClick={onBatal}>Batal</Btn>}
        <Btn type="submit" utama disabled={simpan}>
          {simpan ? 'Menyimpan…' : periode ? 'Simpan Perubahan' : 'Buat PPDB'}
        </Btn>
      </div>
    </form>
  )
}

function JalurModal({ periode, jalur, onClose, onSaved }) {
  const [f, setF] = useState({
    nama: jalur?.nama ?? '',
    kuota: jalur?.kuota ?? '',
    deskripsi: jalur?.deskripsi ?? '',
    nilai_minimal: jalur?.nilai_minimal ?? '',
    aktif: jalur?.aktif ?? true,
    kriteria: jalur?.kriteria ?? [],
  })
  const [error, setError] = useState('')
  const [simpan, setSimpan] = useState(false)
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const ubahKriteria = (i, k, v) => setF((x) => ({ ...x, kriteria: x.kriteria.map((c, n) => (n === i ? { ...c, [k]: v } : c)) }))

  async function kirim(e) {
    e.preventDefault()
    setSimpan(true)
    setError('')
    const data = {
      nama: f.nama,
      kuota: Number(f.kuota),
      deskripsi: f.deskripsi || null,
      nilai_minimal: f.nilai_minimal === '' ? null : Number(f.nilai_minimal),
      aktif: f.aktif,
      kriteria: f.kriteria.map((c) => ({ nama: c.nama, bobot: Number(c.bobot), maks: Number(c.maks || 100) })),
    }
    try {
      if (jalur) await api.ppdbUpdateJalur(jalur.id, data)
      else await api.ppdbCreateJalur(periode.id, data)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSimpan(false)
    }
  }

  return (
    <ModalShell title={jalur ? 'Edit Jalur' : 'Tambah Jalur Penerimaan'} onClose={onClose} lebar="max-w-2xl">
      <form onSubmit={kirim} className="space-y-4">
        <Pesan error={error} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nama jalur" hint="Bebas — sesuaikan dengan kebijakan sekolah/daerah.">
            <input required list="saran-jalur" value={f.nama} onChange={(e) => u('nama', e.target.value)} className={input} />
            <datalist id="saran-jalur">
              {SARAN_JALUR.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Kuota jalur" hint={`Total semua jalur tidak boleh melebihi kuota PPDB (${periode.kuota}).`}>
            <input required type="number" min="0" value={f.kuota} onChange={(e) => u('kuota', e.target.value)} className={input} />
          </Field>
          <Field label="Deskripsi" className="sm:col-span-2">
            <input value={f.deskripsi} onChange={(e) => u('deskripsi', e.target.value)} className={input} />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-navy">Kriteria seleksi</p>
            <Btn kecil onClick={() => u('kriteria', [...f.kriteria, { nama: '', bobot: 1, maks: 100 }])}>
              + Kriteria
            </Btn>
          </div>
          <p className="text-[11px] text-navy/50 mb-2">Skor = Σ(nilai ÷ nilai maks × bobot) ÷ Σ bobot × 100. Beri nama sesuai aturan sekolah (mis. Jarak, Nilai Rapor, Prestasi).</p>
          {f.kriteria.length === 0 && <p className="text-xs text-navy/40">Belum ada kriteria — jalur ini tidak dapat dihitung otomatis; hasil ditandai manual.</p>}
          <div className="space-y-2">
            {f.kriteria.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_90px_auto] gap-2 items-end">
                <Field label={i === 0 ? 'Nama kriteria' : ''}>
                  <input required value={c.nama} onChange={(e) => ubahKriteria(i, 'nama', e.target.value)} className={input} />
                </Field>
                <Field label={i === 0 ? 'Bobot' : ''}>
                  <input required type="number" min="0.01" step="any" value={c.bobot} onChange={(e) => ubahKriteria(i, 'bobot', e.target.value)} className={input} />
                </Field>
                <Field label={i === 0 ? 'Nilai maks' : ''}>
                  <input type="number" min="1" step="any" value={c.maks} onChange={(e) => ubahKriteria(i, 'maks', e.target.value)} className={input} />
                </Field>
                <Btn kecil bahaya onClick={() => u('kriteria', f.kriteria.filter((_, n) => n !== i))}>
                  Hapus
                </Btn>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nilai minimal lolos (skor 0–100, opsional)">
            <input type="number" min="0" max="100" step="any" value={f.nilai_minimal} onChange={(e) => u('nilai_minimal', e.target.value)} className={input} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-navy mt-6">
            <input type="checkbox" checked={f.aktif} onChange={(e) => u('aktif', e.target.checked)} />
            Jalur aktif (menerima pendaftar)
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>Batal</Btn>
          <Btn type="submit" utama disabled={simpan}>
            {simpan ? 'Menyimpan…' : 'Simpan'}
          </Btn>
        </div>
      </form>
    </ModalShell>
  )
}

function PersyaratanModal({ periode, item, onClose, onSaved }) {
  const [f, setF] = useState({ nama: item?.nama ?? '', tahap: item?.tahap ?? 'pendaftaran', ppdb_jalur_id: item?.ppdb_jalur_id ?? '', wajib: item?.wajib ?? true, keterangan: item?.keterangan ?? '' })
  const [error, setError] = useState('')
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))

  async function kirim(e) {
    e.preventDefault()
    setError('')
    const data = { ...f, ppdb_jalur_id: f.ppdb_jalur_id ? Number(f.ppdb_jalur_id) : null, keterangan: f.keterangan || null }
    try {
      if (item) await api.ppdbUpdatePersyaratan(item.id, data)
      else await api.ppdbCreatePersyaratan(periode.id, data)
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <ModalShell title={item ? 'Edit Persyaratan' : 'Tambah Persyaratan'} onClose={onClose} lebar="max-w-lg">
      <form onSubmit={kirim} className="space-y-3">
        <Pesan error={error} />
        <Field label="Nama persyaratan / dokumen">
          <input required value={f.nama} onChange={(e) => u('nama', e.target.value)} className={input} placeholder="mis. Kartu Keluarga" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Tahap">
            <select value={f.tahap} onChange={(e) => u('tahap', e.target.value)} className={input}>
              <option value="pendaftaran">Pendaftaran (diunggah & diverifikasi)</option>
              <option value="daftar_ulang">Daftar ulang (checklist)</option>
            </select>
          </Field>
          <Field label="Berlaku untuk">
            <select value={f.ppdb_jalur_id} onChange={(e) => u('ppdb_jalur_id', e.target.value)} className={input}>
              <option value="">Semua jalur</option>
              {periode.jalur.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nama}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Keterangan">
          <input value={f.keterangan} onChange={(e) => u('keterangan', e.target.value)} className={input} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" checked={f.wajib} onChange={(e) => u('wajib', e.target.checked)} />
          Wajib dipenuhi
        </label>
        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>Batal</Btn>
          <Btn type="submit" utama>
            Simpan
          </Btn>
        </div>
      </form>
    </ModalShell>
  )
}

export default function PpdbPengaturanTab({ periodeId, mulaiBaru, onDibuat, onBerubah, onDihapus }) {
  const [opsi, setOpsi] = useState(null)
  const [periode, setPeriode] = useState(null)
  const [membuat, setMembuat] = useState(Boolean(mulaiBaru) || !periodeId)
  const [mengubah, setMengubah] = useState(false)
  const [jalurModal, setJalurModal] = useState(null)
  const [persyaratanModal, setPersyaratanModal] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const muat = useCallback(() => {
    if (!periodeId) return Promise.resolve()
    return api
      .ppdbGetPeriode(periodeId)
      .then(setPeriode)
      .catch((e) => setError(e.message))
  }, [periodeId])

  useEffect(() => {
    api.ppdbOpsi().then(setOpsi).catch((e) => setError(e.message))
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMembuat(Boolean(mulaiBaru) || !periodeId)
  }, [mulaiBaru, periodeId])

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

  if (!opsi) return <Kosong>Memuat…</Kosong>

  if (membuat) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-bold text-navy">PPDB Baru</h2>
        <p className="text-xs text-navy/50">Isi konfigurasi dasar. Jalur, kuota jalur, dan persyaratan diatur setelah PPDB dibuat, sebelum pendaftaran dibuka.</p>
        <FormPeriode
          opsi={opsi}
          onSimpan={async (data) => {
            const baru = await api.ppdbCreatePeriode(data)
            onDibuat(baru.id)
          }}
          onBatal={periodeId ? () => setMembuat(false) : undefined}
        />
      </div>
    )
  }

  if (!periode) return <Kosong>{error || 'Memuat…'}</Kosong>
  const terkunci = periode.pengumuman_terbit
  const aksi = AKSI_STATUS[periode.status] ?? []
  const totalKuotaJalur = periode.jalur.filter((j) => j.aktif).reduce((a, j) => a + j.kuota, 0)
  const namaJalur = (id) => periode.jalur.find((j) => j.id === id)?.nama ?? 'Semua jalur'

  return (
    <div className="space-y-5">
      <Pesan error={error} info={info} />

      <section className="bg-white rounded-2xl border border-navy/10 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-navy">{periode.nama}</h2>
            <p className="text-xs text-navy/50 mt-0.5">
              TA {periode.tahun_ajaran} · {periode.jenjang || '-'} · Pendaftaran {tgl(periode.tanggal_mulai)} – {tgl(periode.tanggal_selesai)} · Kuota {periode.kuota}
            </p>
          </div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${STATUS_PERIODE_TONE[periode.status]}`}>{periode.status_label}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-4">
          <span className="text-xs font-semibold text-navy/50">Ubah status:</span>
          {aksi.map(([s, l]) => (
            <Btn key={s} kecil utama={s === 'dibuka'} onClick={() => jalankan(() => api.ppdbStatusPeriode(periode.id, s), `Status diubah: ${l}.`)}>
              {l}
            </Btn>
          ))}
          {periode.status === 'draft' && !periode.pendaftar_count && (
            <Btn
              kecil
              bahaya
              onClick={() => {
                if (window.confirm('Hapus PPDB ini beserta jalur dan persyaratannya?')) jalankan(() => api.ppdbDeletePeriode(periode.id)).then(() => onDihapus?.())
              }}
            >
              Hapus PPDB
            </Btn>
          )}
          <span className="flex-1" />
          <Btn kecil onClick={() => setMembuat(true)}>
            + PPDB Baru
          </Btn>
        </div>
        {terkunci && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3">Pengumuman sudah terbit, pengaturan dikunci. Batalkan publikasi di tab Pengumuman untuk mengubahnya.</p>}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-navy">Konfigurasi Periode & Jadwal</h3>
          {!terkunci && !mengubah && (
            <Btn kecil onClick={() => setMengubah(true)}>
              Edit
            </Btn>
          )}
        </div>
        {mengubah ? (
          <FormPeriode
            periode={periode}
            opsi={opsi}
            onSimpan={async (data) => {
              await api.ppdbUpdatePeriode(periode.id, data)
              setMengubah(false)
              setInfo('Pengaturan disimpan.')
              await muat()
              onBerubah?.()
            }}
            onBatal={() => setMengubah(false)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-navy/10 p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            {[
              ['Tahun Ajaran', periode.tahun_ajaran],
              ['Nama PPDB', periode.nama],
              ['Jenjang', periode.jenjang || '-'],
              ['Kuota penerimaan', periode.kuota],
              ['Jumlah rombel', periode.jumlah_rombel ?? '-'],
              ['Kapasitas per rombel', periode.kapasitas_rombel ?? '-'],
              ['Pendaftaran', `${tgl(periode.tanggal_mulai)} – ${tgl(periode.tanggal_selesai)}`],
              ['Jadwal seleksi', tgl(periode.jadwal_seleksi)],
              ['Jadwal pengumuman', tgl(periode.jadwal_pengumuman)],
              ['Daftar ulang', `${tgl(periode.daftar_ulang_mulai)} – ${tgl(periode.daftar_ulang_selesai)}`],
              ['Catatan', periode.catatan || '-'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[11px] text-navy/50">{k}</p>
                <p className="font-semibold text-navy">{v}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-navy">Jalur Penerimaan</h3>
            <p className="text-[11px] text-navy/50">
              Kuota jalur aktif {totalKuotaJalur} dari {periode.kuota}
              {totalKuotaJalur < periode.kuota ? ` — ${periode.kuota - totalKuotaJalur} kursi belum dialokasikan` : ''}
            </p>
          </div>
          {!terkunci && (
            <Btn kecil utama onClick={() => setJalurModal({})}>
              + Jalur
            </Btn>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                {['Jalur', 'Kuota', 'Kriteria seleksi', 'Nilai min.', 'Status', ''].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {periode.jalur.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-xs text-navy/40">
                    Belum ada jalur. Tambahkan minimal satu jalur sebelum membuka pendaftaran.
                  </td>
                </tr>
              )}
              {periode.jalur.map((j) => (
                <tr key={j.id} className="align-top">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-navy">{j.nama}</p>
                    {j.deskripsi && <p className="text-[11px] text-navy/50">{j.deskripsi}</p>}
                  </td>
                  <td className="px-3 py-2">{j.kuota}</td>
                  <td className="px-3 py-2 text-xs text-navy/70">{j.kriteria.length ? j.kriteria.map((c) => `${c.nama} (${c.bobot})`).join(', ') : <span className="text-navy/40">Manual</span>}</td>
                  <td className="px-3 py-2">{j.nilai_minimal ?? '-'}</td>
                  <td className="px-3 py-2">
                    <Badge tone={j.aktif ? 'hijau' : 'abu'}>{j.aktif ? 'Aktif' : 'Nonaktif'}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                    {!terkunci && (
                      <>
                        <Btn kecil onClick={() => setJalurModal(j)}>
                          Edit
                        </Btn>
                        <Btn
                          kecil
                          bahaya
                          onClick={() => {
                            if (window.confirm(`Hapus jalur "${j.nama}"?`)) jalankan(() => api.ppdbDeleteJalur(j.id), 'Jalur dihapus.')
                          }}
                        >
                          Hapus
                        </Btn>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-navy">Persyaratan</h3>
          <Btn kecil utama onClick={() => setPersyaratanModal({})}>
            + Persyaratan
          </Btn>
        </div>
        <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                {['Persyaratan', 'Tahap', 'Berlaku untuk', 'Wajib', ''].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {periode.persyaratan.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-xs text-navy/40">
                    Belum ada persyaratan.
                  </td>
                </tr>
              )}
              {periode.persyaratan.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-navy">{r.nama}</p>
                    {r.keterangan && <p className="text-[11px] text-navy/50">{r.keterangan}</p>}
                  </td>
                  <td className="px-3 py-2">{r.tahap === 'pendaftaran' ? 'Pendaftaran' : 'Daftar ulang'}</td>
                  <td className="px-3 py-2">{r.ppdb_jalur_id ? namaJalur(r.ppdb_jalur_id) : 'Semua jalur'}</td>
                  <td className="px-3 py-2">{r.wajib ? 'Ya' : 'Tidak'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                    <Btn kecil onClick={() => setPersyaratanModal(r)}>
                      Edit
                    </Btn>
                    <Btn
                      kecil
                      bahaya
                      onClick={() => {
                        if (window.confirm(`Hapus persyaratan "${r.nama}"?`)) jalankan(() => api.ppdbDeletePersyaratan(r.id), 'Persyaratan dihapus.')
                      }}
                    >
                      Hapus
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {jalurModal && (
        <JalurModal
          periode={periode}
          jalur={jalurModal.id ? jalurModal : null}
          onClose={() => setJalurModal(null)}
          onSaved={() => {
            setJalurModal(null)
            setInfo('Jalur disimpan.')
            muat()
            onBerubah?.()
          }}
        />
      )}
      {persyaratanModal && (
        <PersyaratanModal
          periode={periode}
          item={persyaratanModal.id ? persyaratanModal : null}
          onClose={() => setPersyaratanModal(null)}
          onSaved={() => {
            setPersyaratanModal(null)
            setInfo('Persyaratan disimpan.')
            muat()
          }}
        />
      )}
    </div>
  )
}
