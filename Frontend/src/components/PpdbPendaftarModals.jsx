import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { AGAMA, LABEL_DOKUMEN, TONE_DAFTAR_ULANG, TONE_DOKUMEN, TONE_SELEKSI, TONE_VERIFIKASI, tgl, ukuranFile, waktu } from './ppdbKonstanta'

const input = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white'

const KOSONG = {
  ppdb_jalur_id: '',
  nik: '',
  nisn: '',
  nama_lengkap: '',
  nama_panggilan: '',
  jenis_kelamin: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  agama: '',
  alamat: '',
  no_hp: '',
  email: '',
  nama_ayah: '',
  nama_ibu: '',
  nama_wali: '',
  nik_orang_tua: '',
  pekerjaan_orang_tua: '',
  penghasilan_orang_tua: '',
  telepon_orang_tua: '',
  sekolah_asal: '',
  npsn_sekolah_asal: '',
  tahun_lulus: '',
  nomor_ijazah: '',
  pilihan_program: '',
}

const KELOMPOK = [
  {
    judul: 'Data Pribadi',
    isi: [
      ['nik', 'NIK'],
      ['nisn', 'NISN'],
      ['nama_lengkap', 'Nama lengkap'],
      ['nama_panggilan', 'Nama panggilan'],
      ['jenis_kelamin', 'Jenis kelamin', (v) => (v === 'L' ? 'Laki-laki' : v === 'P' ? 'Perempuan' : '-')],
      ['tempat_lahir', 'Tempat lahir'],
      ['tanggal_lahir', 'Tanggal lahir', tgl],
      ['agama', 'Agama'],
      ['no_hp', 'Nomor HP'],
      ['email', 'Email'],
      ['alamat', 'Alamat'],
    ],
  },
  {
    judul: 'Data Orang Tua / Wali',
    isi: [
      ['nama_ayah', 'Nama ayah'],
      ['nama_ibu', 'Nama ibu'],
      ['nama_wali', 'Nama wali'],
      ['nik_orang_tua', 'NIK orang tua/wali'],
      ['pekerjaan_orang_tua', 'Pekerjaan'],
      ['penghasilan_orang_tua', 'Penghasilan'],
      ['telepon_orang_tua', 'Telepon'],
    ],
  },
  {
    judul: 'Asal Sekolah',
    isi: [
      ['sekolah_asal', 'Nama sekolah asal'],
      ['npsn_sekolah_asal', 'NPSN'],
      ['tahun_lulus', 'Tahun lulus'],
      ['nomor_ijazah', 'Nomor ijazah/SKL'],
    ],
  },
]

export function PendaftarFormModal({ periode, pendaftar, onClose, onSaved }) {
  const edit = Boolean(pendaftar)
  const [f, setF] = useState(() => (pendaftar ? Object.fromEntries(Object.keys(KOSONG).map((k) => [k, pendaftar[k] ?? ''])) : { ...KOSONG, ppdb_jalur_id: periode.jalur.filter((j) => j.aktif)[0]?.id ?? '' }))
  const [error, setError] = useState('')
  const [simpan, setSimpan] = useState(false)
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const t = (k, label, extra = {}) => (
    <Field label={label} key={k}>
      <input value={f[k]} onChange={(e) => u(k, e.target.value)} className={input} {...extra} />
    </Field>
  )

  async function kirim(e) {
    e.preventDefault()
    setSimpan(true)
    setError('')
    const data = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === '' ? null : v]))
    data.ppdb_jalur_id = Number(f.ppdb_jalur_id)
    if (data.tahun_lulus) data.tahun_lulus = Number(data.tahun_lulus)
    try {
      const hasil = edit ? await api.ppdbUpdatePendaftar(pendaftar.id, data) : await api.ppdbCreatePendaftar({ ...data, periode_id: periode.id })
      onSaved(hasil)
    } catch (err) {
      setError(err.message)
    } finally {
      setSimpan(false)
    }
  }

  return (
    <ModalShell title={edit ? `Edit Pendaftar — ${pendaftar.nomor_pendaftaran}` : 'Tambah Pendaftar'} onClose={onClose} lebar="max-w-4xl">
      <form onSubmit={kirim} className="space-y-5">
        <Pesan error={error} />
        {edit && pendaftar.status_verifikasi !== 'belum' && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Mengubah data identitas/orang tua/sekolah akan mengembalikan status verifikasi menjadi “Belum Diverifikasi”.</p>}

        <fieldset>
          <legend className="text-sm font-bold text-navy mb-2">Pilihan PPDB</legend>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Jalur pendaftaran">
              <select required value={f.ppdb_jalur_id} onChange={(e) => u('ppdb_jalur_id', e.target.value)} className={input}>
                <option value="">Pilih jalur</option>
                {periode.jalur
                  .filter((j) => j.aktif || j.id === pendaftar?.ppdb_jalur_id)
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                    </option>
                  ))}
              </select>
            </Field>
            {t('pilihan_program', 'Pilihan program/kelas (jika ada)')}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold text-navy mb-2">Data Pribadi</legend>
          <div className="grid sm:grid-cols-3 gap-3">
            {t('nik', 'NIK (16 digit)', { required: true, maxLength: 16, inputMode: 'numeric' })}
            {t('nisn', 'NISN (10 digit, jika ada)', { maxLength: 10, inputMode: 'numeric' })}
            {t('nama_lengkap', 'Nama lengkap', { required: true })}
            {t('nama_panggilan', 'Nama panggilan')}
            <Field label="Jenis kelamin">
              <select required value={f.jenis_kelamin} onChange={(e) => u('jenis_kelamin', e.target.value)} className={input}>
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
            {t('tempat_lahir', 'Tempat lahir')}
            <Field label="Tanggal lahir">
              <input type="date" value={f.tanggal_lahir} onChange={(e) => u('tanggal_lahir', e.target.value)} className={input} />
            </Field>
            <Field label="Agama">
              <select value={f.agama} onChange={(e) => u('agama', e.target.value)} className={input}>
                <option value="">Pilih</option>
                {AGAMA.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            {t('no_hp', 'Nomor HP')}
            {t('email', 'Email', { type: 'email' })}
            <Field label="Alamat" className="sm:col-span-3">
              <textarea rows={2} value={f.alamat} onChange={(e) => u('alamat', e.target.value)} className={input} />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold text-navy mb-2">Data Orang Tua / Wali</legend>
          <div className="grid sm:grid-cols-3 gap-3">
            {t('nama_ayah', 'Nama ayah')}
            {t('nama_ibu', 'Nama ibu')}
            {t('nama_wali', 'Nama wali')}
            {t('nik_orang_tua', 'NIK orang tua/wali', { maxLength: 16, inputMode: 'numeric' })}
            {t('pekerjaan_orang_tua', 'Pekerjaan')}
            {t('penghasilan_orang_tua', 'Penghasilan')}
            {t('telepon_orang_tua', 'Nomor telepon')}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold text-navy mb-2">Asal Sekolah</legend>
          <div className="grid sm:grid-cols-4 gap-3">
            {t('sekolah_asal', 'Nama sekolah asal')}
            {t('npsn_sekolah_asal', 'NPSN sekolah asal', { maxLength: 12 })}
            {t('tahun_lulus', 'Tahun lulus', { type: 'number', min: 1990, max: 2100 })}
            {t('nomor_ijazah', 'Nomor ijazah/SKL')}
          </div>
        </fieldset>

        {!edit && <p className="text-xs text-navy/50">Nomor pendaftaran dibuat otomatis. Dokumen persyaratan diunggah setelah data tersimpan.</p>}
        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>Batal</Btn>
          <Btn type="submit" utama disabled={simpan}>
            {simpan ? 'Menyimpan…' : edit ? 'Simpan Perubahan' : 'Simpan & Lanjut ke Dokumen'}
          </Btn>
        </div>
      </form>
    </ModalShell>
  )
}

function PreviewDokumen({ dokumen, onClose }) {
  const [blob, setBlob] = useState(null)
  const [error, setError] = useState('')
  const urlRef = useRef(null)

  useEffect(() => {
    let batal = false
    api
      .ppdbBlobDokumen(dokumen.id)
      .then((b) => {
        urlRef.current = b.url
        if (!batal) setBlob(b)
      })
      .catch((e) => !batal && setError(e.message))
    return () => {
      batal = true
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [dokumen.id])

  return (
    <ModalShell title={`Preview — ${dokumen.nama}`} onClose={onClose} lebar="max-w-4xl" footer={<Btn onClick={() => api.ppdbUnduhDokumen(dokumen.id, dokumen.nama_asli)}>Download</Btn>}>
      {error && <Pesan error={error} />}
      {!blob && !error && <Kosong>Memuat berkas…</Kosong>}
      {blob && (blob.tipe.startsWith('image/') ? <img src={blob.url} alt={dokumen.nama} className="max-w-full mx-auto rounded" /> : <iframe src={blob.url} title={dokumen.nama} className="w-full h-[70vh] rounded border border-navy/10" />)}
    </ModalShell>
  )
}

function BarisDokumen({ pendaftar, persyaratan, dokumen, bolehUbah, onPerubahan, setError }) {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [memeriksa, setMemeriksa] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [sibuk, setSibuk] = useState(false)

  async function unggah(file) {
    if (!file) return
    setSibuk(true)
    setError('')
    try {
      onPerubahan(await api.ppdbUnggahDokumen(pendaftar.id, file, persyaratan?.id))
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function periksa(status, catatan) {
    setError('')
    try {
      onPerubahan(await api.ppdbPeriksaDokumen(dokumen.id, { status, catatan: catatan || null }))
      setMemeriksa(false)
      setAlasan('')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="border border-navy/10 rounded-xl p-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">
            {persyaratan ? persyaratan.nama : dokumen.nama}
            {persyaratan && (persyaratan.wajib ? <span className="text-red-500 ml-1">*</span> : <span className="text-[10px] text-navy/40 ml-1">(opsional)</span>)}
          </p>
          {dokumen ? (
            <p className="text-[11px] text-navy/50">
              {dokumen.nama_asli} · {ukuranFile(dokumen.ukuran)} · diunggah {waktu(dokumen.created_at)}
            </p>
          ) : (
            <p className="text-[11px] text-navy/40">Belum diunggah</p>
          )}
          {dokumen?.catatan && <p className="text-[11px] text-red-600 mt-0.5">Catatan: {dokumen.catatan}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dokumen && <Badge tone={TONE_DOKUMEN[dokumen.status]}>{LABEL_DOKUMEN[dokumen.status]}</Badge>}
          {dokumen && (
            <Btn kecil onClick={() => setPreview(dokumen)}>
              Preview
            </Btn>
          )}
          {dokumen && (
            <Btn kecil onClick={() => api.ppdbUnduhDokumen(dokumen.id, dokumen.nama_asli).catch((e) => setError(e.message))}>
              Download
            </Btn>
          )}
          {bolehUbah && (
            <>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => unggah(e.target.files[0])} />
              <Btn kecil utama={!dokumen} disabled={sibuk} onClick={() => fileRef.current?.click()}>
                {sibuk ? 'Mengunggah…' : dokumen ? 'Ganti' : 'Unggah'}
              </Btn>
              {dokumen && (
                <Btn
                  kecil
                  bahaya
                  onClick={async () => {
                    if (!window.confirm('Hapus dokumen ini?')) return
                    try {
                      onPerubahan(await api.ppdbHapusDokumen(dokumen.id))
                    } catch (e) {
                      setError(e.message)
                    }
                  }}
                >
                  Hapus
                </Btn>
              )}
            </>
          )}
        </div>
      </div>

      {dokumen && bolehUbah && (
        <div className="mt-2 pt-2 border-t border-navy/5">
          {!memeriksa ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-navy/50">Keabsahan:</span>
              <Btn kecil onClick={() => periksa('sah')}>
                ✓ Sah
              </Btn>
              <Btn kecil bahaya onClick={() => setMemeriksa(true)}>
                ✗ Tidak sah
              </Btn>
              {dokumen.status !== 'menunggu' && (
                <Btn kecil onClick={() => periksa('menunggu')}>
                  Reset
                </Btn>
              )}
              {dokumen.tanggal_periksa && <span className="text-[11px] text-navy/40">diperiksa {waktu(dokumen.tanggal_periksa)}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Alasan dokumen tidak sah (wajib)" className={`${input} !py-1`} />
              <Btn kecil bahaya onClick={() => periksa('tidak_sah', alasan)}>
                Simpan
              </Btn>
              <Btn kecil onClick={() => setMemeriksa(false)}>
                Batal
              </Btn>
            </div>
          )}
        </div>
      )}
      {preview && <PreviewDokumen dokumen={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function PanelVerifikasi({ p, periode, onPerubahan, setError, setInfo }) {
  const [cek, setCek] = useState(() => p.hasil_verifikasi ?? {})
  const [catatan, setCatatan] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const terkunci = periode.pengumuman_terbit || p.status_seleksi !== 'belum' || p.status_penerimaan === 'diterima' || p.status_pendaftaran !== 'terdaftar'
  const daftar = p.checklist_definisi.filter((c) => c.key !== 'nisn' || p.nisn)

  async function kirim(keputusan) {
    setSibuk(true)
    setError('')
    setInfo('')
    try {
      onPerubahan(await api.ppdbVerifikasi(p.id, { keputusan, catatan: catatan || null, checklist: cek }))
      setCatatan('')
      setInfo(keputusan === 'setujui' ? 'Data disetujui.' : keputusan === 'tolak' ? 'Data ditolak.' : 'Permintaan perbaikan dicatat.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone={TONE_VERIFIKASI[p.status_verifikasi]}>{p.status_verifikasi_label}</Badge>
        {p.tanggal_verifikasi && (
          <span className="text-xs text-navy/50">
            oleh {p.diverifikasi_oleh ?? '-'} · {waktu(p.tanggal_verifikasi)}
          </span>
        )}
      </div>
      {p.catatan_verifikasi && <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-900">Catatan verifikasi: {p.catatan_verifikasi}</p>}
      {terkunci && <p className="text-xs text-navy/50 bg-navy/5 rounded-lg px-3 py-2">Verifikasi terkunci karena pendaftar sudah memiliki hasil seleksi/pengumuman, dibatalkan, atau diterima.</p>}

      <div>
        <p className="text-xs font-bold text-navy mb-2">Yang diperiksa</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {daftar.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm text-navy border border-navy/10 rounded-lg px-3 py-2">
              <input type="checkbox" disabled={terkunci} checked={Boolean(cek[c.key])} onChange={(e) => setCek((x) => ({ ...x, [c.key]: e.target.checked }))} />
              {c.label}
            </label>
          ))}
        </div>
        <p className="text-[11px] text-navy/40 mt-1.5">Persetujuan mensyaratkan semua butir dicentang dan seluruh dokumen wajib berstatus sah (tab Dokumen).</p>
      </div>

      <Field label="Catatan verifikasi" hint="Wajib diisi bila menolak atau meminta perbaikan, agar jelas alasannya.">
        <textarea rows={3} disabled={terkunci} value={catatan} onChange={(e) => setCatatan(e.target.value)} className={input} />
      </Field>
      <div className="flex gap-2 flex-wrap">
        <Btn utama disabled={terkunci || sibuk} onClick={() => kirim('setujui')}>
          Setujui
        </Btn>
        <Btn disabled={terkunci || sibuk} onClick={() => kirim('perbaikan')}>
          Minta Perbaikan
        </Btn>
        <Btn bahaya disabled={terkunci || sibuk} onClick={() => kirim('tolak')}>
          Tolak
        </Btn>
      </div>
    </div>
  )
}

export function PendaftarDetailModal({ id, periode, fokus = 'data', onClose, onChanged }) {
  const [p, setP] = useState(null)
  const [tab, setTab] = useState(fokus)
  const [edit, setEdit] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [lain, setLain] = useState('')
  const lainRef = useRef(null)

  const muat = useCallback(() => api.ppdbGetPendaftar(id).then(setP).catch((e) => setError(e.message)), [id])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  function terbaru(data) {
    setP(data)
    onChanged?.()
  }

  if (!p) {
    return (
      <ModalShell title="Detail Pendaftar" onClose={onClose}>
        {error ? <Pesan error={error} /> : <Kosong>Memuat…</Kosong>}
      </ModalShell>
    )
  }

  if (edit) {
    return (
      <PendaftarFormModal
        periode={periode}
        pendaftar={p}
        onClose={() => setEdit(false)}
        onSaved={(d) => {
          setEdit(false)
          terbaru(d)
        }}
      />
    )
  }

  const aktif = p.status_pendaftaran === 'terdaftar' && p.status_penerimaan !== 'diterima'
  const bolehDokumen = aktif
  const dokumenPersyaratan = new Set(p.persyaratan.map((r) => r.dokumen_id).filter(Boolean))
  const dokumenLain = p.dokumen.filter((d) => !dokumenPersyaratan.has(d.id))

  const TAB = [
    ['data', 'Data'],
    ['dokumen', `Dokumen (${p.dokumen.length})`],
    ['verifikasi', 'Verifikasi'],
    ['riwayat', 'Riwayat'],
  ]

  return (
    <ModalShell
      title={`${p.nama_lengkap}`}
      onClose={onClose}
      lebar="max-w-4xl"
      footer={
        <>
          <Btn onClick={() => api.ppdbBukti(p.id, `bukti-${p.nomor_pendaftaran}.pdf`).catch((e) => setError(e.message))}>Cetak Bukti Pendaftaran</Btn>
          {aktif && <Btn onClick={() => setEdit(true)}>Edit Data</Btn>}
        </>
      }
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-xs font-mono font-bold text-navy bg-navy/5 rounded px-2 py-1">{p.nomor_pendaftaran}</span>
        <span className="text-xs text-navy/60">{p.jalur}</span>
        {p.status_pendaftaran === 'dibatalkan' && <Badge tone="merah">Dibatalkan</Badge>}
        <Badge tone={TONE_VERIFIKASI[p.status_verifikasi]}>{p.status_verifikasi_label}</Badge>
        <Badge tone={TONE_SELEKSI[p.status_seleksi]}>{p.status_seleksi_label}</Badge>
        {p.status_seleksi === 'lolos' && <Badge tone={TONE_DAFTAR_ULANG[p.status_daftar_ulang]}>{p.status_daftar_ulang_label}</Badge>}
        {p.status_penerimaan === 'diterima' && <Badge tone="hijau">Diterima{p.nis_terbit ? ` · NIS ${p.nis_terbit}` : ''}</Badge>}
        <span className="flex-1" />
        {p.status_pendaftaran === 'terdaftar' && p.status_penerimaan !== 'diterima' && !periode.pengumuman_terbit && (
          <Btn
            kecil
            bahaya
            onClick={async () => {
              const alasan = window.prompt('Alasan pembatalan pendaftaran:')
              if (!alasan) return
              try {
                terbaru(await api.ppdbBatalkanPendaftar(p.id, alasan))
              } catch (e) {
                setError(e.message)
              }
            }}
          >
            Batalkan Pendaftaran
          </Btn>
        )}
        {p.status_pendaftaran === 'dibatalkan' && !periode.pengumuman_terbit && (
          <Btn
            kecil
            onClick={async () => {
              try {
                terbaru(await api.ppdbPulihkanPendaftar(p.id))
              } catch (e) {
                setError(e.message)
              }
            }}
          >
            Pulihkan
          </Btn>
        )}
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {TAB.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${tab === k ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
            {l}
          </button>
        ))}
      </div>
      <Pesan error={error} info={info} />

      {tab === 'data' && (
        <div className="space-y-5">
          {KELOMPOK.map((g) => (
            <section key={g.judul}>
              <h4 className="text-xs font-bold uppercase text-navy/50 mb-2">{g.judul}</h4>
              <div className="grid sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                {g.isi.map(([k, label, fmt]) => (
                  <div key={k} className={k === 'alamat' ? 'sm:col-span-3' : ''}>
                    <p className="text-[11px] text-navy/50">{label}</p>
                    <p className="font-semibold text-navy break-words">{(fmt ? fmt(p[k]) : p[k]) || '-'}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <section>
            <h4 className="text-xs font-bold uppercase text-navy/50 mb-2">Pilihan PPDB</h4>
            <p className="text-sm text-navy">
              <span className="font-semibold">{p.jalur}</span>
              {p.pilihan_program ? ` · ${p.pilihan_program}` : ''}
            </p>
          </section>
          {p.nilai_seleksi && Object.keys(p.nilai_seleksi).length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase text-navy/50 mb-2">Nilai Seleksi</h4>
              <p className="text-sm text-navy">
                {Object.entries(p.nilai_seleksi)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' · ')}
                {p.skor !== null && <span className="font-bold"> → skor {p.skor}</span>}
              </p>
            </section>
          )}
        </div>
      )}

      {tab === 'dokumen' && (
        <div className="space-y-3">
          {!bolehDokumen && <p className="text-xs text-navy/50 bg-navy/5 rounded-lg px-3 py-2">Dokumen terkunci (pendaftaran dibatalkan atau peserta sudah diterima).</p>}
          {p.persyaratan.length === 0 && <p className="text-xs text-navy/40">Belum ada persyaratan dokumen untuk jalur ini. Anda tetap dapat mengunggah dokumen lain di bawah.</p>}
          {p.persyaratan.map((r) => (
            <BarisDokumen key={r.id} pendaftar={p} persyaratan={r} dokumen={p.dokumen.find((d) => d.id === r.dokumen_id)} bolehUbah={bolehDokumen} onPerubahan={terbaru} setError={setError} />
          ))}
          {dokumenLain.length > 0 && <h4 className="text-xs font-bold uppercase text-navy/50 pt-2">Dokumen lain</h4>}
          {dokumenLain.map((d) => (
            <BarisDokumen key={d.id} pendaftar={p} persyaratan={null} dokumen={d} bolehUbah={bolehDokumen} onPerubahan={terbaru} setError={setError} />
          ))}
          {bolehDokumen && (
            <div className="flex items-end gap-2 pt-2">
              <Field label="Tambah dokumen lain (nama dokumen)" className="flex-1">
                <input value={lain} onChange={(e) => setLain(e.target.value)} className={input} placeholder="mis. Surat keterangan domisili" />
              </Field>
              <input
                ref={lainRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  try {
                    terbaru(await api.ppdbUnggahDokumen(p.id, file, null, lain || undefined))
                    setLain('')
                  } catch (err) {
                    setError(err.message)
                  }
                  e.target.value = ''
                }}
              />
              <Btn onClick={() => lainRef.current?.click()}>Pilih File & Unggah</Btn>
            </div>
          )}
          <p className="text-[11px] text-navy/40">Format PDF/JPG/PNG, maksimal 3 MB per berkas.</p>
        </div>
      )}

      {tab === 'verifikasi' && <PanelVerifikasi key={`${p.status_verifikasi}-${p.tanggal_verifikasi}`} p={p} periode={periode} onPerubahan={terbaru} setError={setError} setInfo={setInfo} />}

      {tab === 'riwayat' && <RiwayatList items={p.riwayat} />}
    </ModalShell>
  )
}
