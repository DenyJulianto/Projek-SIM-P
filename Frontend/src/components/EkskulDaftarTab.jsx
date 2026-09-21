import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { KATEGORI_TONE } from './ekskulKonstanta'
import { Badge, Btn, Field, Kosong, ModalShell, Pesan } from './PpdbUI'
import { selectClass, tgl } from './ppdbKonstanta'

const input = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white'

/** Logo/foto ekstrakurikuler; berkas privat sehingga dimuat lewat permintaan terautentikasi. */
export function LogoEkskul({ id, ada, ukuran = 'h-12 w-12', versi = 0 }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!ada) return
    let batal = false
    let objek = null
    api
      .ekskulBlobLogo(id)
      .then((u) => {
        objek = u
        if (!batal) setUrl(u)
      })
      .catch(() => {})
    return () => {
      batal = true
      if (objek) URL.revokeObjectURL(objek)
    }
  }, [id, ada, versi])
  if (!ada || !url) {
    return (
      <span className={`${ukuran} rounded-xl bg-emerald-50 text-navy-light flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-1/2 w-1/2">
          <path d="M4 3v18" />
          <path d="M4 4h13l-2.5 4L17 12H4" />
        </svg>
      </span>
    )
  }
  return <img src={url} alt="Logo" className={`${ukuran} rounded-xl object-cover shrink-0`} />
}

const FORM_KOSONG = { nama: '', kategori: 'lainnya', deskripsi: '', pembina_guru_id: '', pelatih: '', hari: '', jam_mulai: '', jam_selesai: '', tempat: '', kuota: '', persyaratan: '', aspek_penilaian: [], status: 'aktif' }

function FormEkskul({ opsi, filter, ekskul, onClose, onSaved }) {
  const edit = Boolean(ekskul)
  const [f, setF] = useState(() =>
    edit
      ? { ...Object.fromEntries(Object.keys(FORM_KOSONG).map((k) => [k, ekskul[k] ?? (k === 'aspek_penilaian' ? [] : '')])), tahun_ajaran_id: ekskul.tahun_ajaran_id, semester: ekskul.semester }
      : { ...FORM_KOSONG, aspek_penilaian: [...opsi.aspek_bawaan], tahun_ajaran_id: filter.tahun_ajaran_id, semester: filter.semester || opsi.semester_aktif || 'ganjil' },
  )
  const [aspekBaru, setAspekBaru] = useState('')
  const [error, setError] = useState('')
  const [simpan, setSimpan] = useState(false)
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const semuaAspek = [...new Set([...opsi.aspek_bawaan, ...f.aspek_penilaian])]
  const toggle = (a) => u('aspek_penilaian', f.aspek_penilaian.includes(a) ? f.aspek_penilaian.filter((x) => x !== a) : [...f.aspek_penilaian, a])

  async function kirim(e) {
    e.preventDefault()
    setSimpan(true)
    setError('')
    const data = {
      ...f,
      tahun_ajaran_id: Number(f.tahun_ajaran_id),
      pembina_guru_id: f.pembina_guru_id ? Number(f.pembina_guru_id) : null,
      kuota: f.kuota === '' ? null : Number(f.kuota),
      ...Object.fromEntries(['deskripsi', 'pelatih', 'hari', 'jam_mulai', 'jam_selesai', 'tempat', 'persyaratan'].map((k) => [k, f[k] || null])),
    }
    try {
      onSaved(edit ? await api.ekskulUpdate(ekskul.id, data) : await api.ekskulCreate(data))
    } catch (err) {
      setError(err.message)
      setSimpan(false)
    }
  }

  return (
    <ModalShell title={edit ? `Edit — ${ekskul.nama}` : 'Tambah Ekstrakurikuler'} onClose={onClose} lebar="max-w-3xl">
      <form onSubmit={kirim} className="space-y-4">
        <Pesan error={error} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Nama ekstrakurikuler" className="sm:col-span-2">
            <input required value={f.nama} onChange={(e) => u('nama', e.target.value)} className={input} />
          </Field>
          <Field label="Kategori">
            <select value={f.kategori} onChange={(e) => u('kategori', e.target.value)} className={input}>
              {opsi.kategori.map((k) => (
                <option key={k.key} value={k.key}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tahun ajaran">
            <select required value={f.tahun_ajaran_id} onChange={(e) => u('tahun_ajaran_id', e.target.value)} className={input}>
              <option value="">Pilih</option>
              {opsi.tahun_ajaran.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Semester">
            <select value={f.semester} onChange={(e) => u('semester', e.target.value)} className={input}>
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={(e) => u('status', e.target.value)} className={input}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </Field>
          <Field label="Pembina">
            <select value={f.pembina_guru_id} onChange={(e) => u('pembina_guru_id', e.target.value)} className={input}>
              <option value="">Belum ditentukan</option>
              {opsi.guru.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pelatih">
            <input value={f.pelatih} onChange={(e) => u('pelatih', e.target.value)} className={input} placeholder="Nama pelatih (bila ada)" />
          </Field>
          <Field label="Kuota peserta" hint="Kosongkan bila tanpa batas.">
            <input type="number" min="1" value={f.kuota} onChange={(e) => u('kuota', e.target.value)} className={input} />
          </Field>
          <Field label="Hari">
            <select value={f.hari} onChange={(e) => u('hari', e.target.value)} className={input}>
              <option value="">Tidak rutin</option>
              {opsi.hari.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </Field>
          <Field label="Jam mulai">
            <input type="time" value={f.jam_mulai} onChange={(e) => u('jam_mulai', e.target.value)} className={input} />
          </Field>
          <Field label="Jam selesai">
            <input type="time" value={f.jam_selesai} onChange={(e) => u('jam_selesai', e.target.value)} className={input} />
          </Field>
          <Field label="Tempat" className="sm:col-span-3">
            <input value={f.tempat} onChange={(e) => u('tempat', e.target.value)} className={input} />
          </Field>
          <Field label="Deskripsi" className="sm:col-span-3">
            <textarea rows={2} value={f.deskripsi} onChange={(e) => u('deskripsi', e.target.value)} className={input} />
          </Field>
          <Field label="Persyaratan" className="sm:col-span-3">
            <textarea rows={2} value={f.persyaratan} onChange={(e) => u('persyaratan', e.target.value)} className={input} placeholder="mis. Bersedia mengikuti latihan, membawa perlengkapan sendiri" />
          </Field>
        </div>

        <div>
          <p className="text-xs font-bold text-navy mb-1">Aspek penilaian</p>
          <p className="text-[11px] text-navy/50 mb-2">Pilih aspek yang dinilai pada ekstrakurikuler ini — tidak harus semua. Anda juga dapat menambah aspek sendiri.</p>
          <div className="flex flex-wrap gap-2">
            {semuaAspek.map((a) => (
              <button key={a} type="button" onClick={() => toggle(a)} className={`text-xs font-semibold px-3 py-1 rounded-full border ${f.aspek_penilaian.includes(a) ? 'bg-navy text-white border-navy' : 'border-navy/20 text-navy/60'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={aspekBaru} onChange={(e) => setAspekBaru(e.target.value)} placeholder="Aspek lain…" className={`${input} max-w-56`} />
            <Btn
              kecil
              onClick={() => {
                const a = aspekBaru.trim()
                if (a && !f.aspek_penilaian.includes(a)) u('aspek_penilaian', [...f.aspek_penilaian, a])
                setAspekBaru('')
              }}
            >
              Tambah Aspek
            </Btn>
          </div>
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

function DetailEkskul({ id, onClose, onChanged }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const [versi, setVersi] = useState(0)
  const fileRef = useRef(null)
  const muat = useCallback(() => api.ekskulGet(id).then(setD).catch((e) => setError(e.message)), [id])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  async function logo(file) {
    if (!file) return
    setError('')
    try {
      await api.ekskulUnggahLogo(id, file)
      setVersi((v) => v + 1)
      await muat()
      onChanged()
    } catch (e) {
      setError(e.message)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  if (!d) {
    return (
      <ModalShell title="Detail Ekstrakurikuler" onClose={onClose}>
        {error ? <Pesan error={error} /> : <Kosong>Memuat…</Kosong>}
      </ModalShell>
    )
  }

  return (
    <ModalShell title={d.nama} onClose={onClose} lebar="max-w-2xl">
      <Pesan error={error} />
      <div className="flex items-start gap-4 mb-4">
        <LogoEkskul id={d.id} ada={d.punya_logo} ukuran="h-24 w-24" versi={versi} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${KATEGORI_TONE[d.kategori]}`}>{d.kategori_label}</span>
            <Badge tone={d.status === 'aktif' ? 'hijau' : 'abu'}>{d.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge>
            <span className="text-xs text-navy/50">
              TA {d.tahun_ajaran} · Semester {d.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
            </span>
          </div>
          {d.deskripsi && <p className="text-sm text-navy/70 mt-2">{d.deskripsi}</p>}
          <div className="flex gap-2 mt-3">
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => logo(e.target.files[0])} />
            <Btn kecil onClick={() => fileRef.current?.click()}>
              {d.punya_logo ? 'Ganti Logo/Foto' : 'Unggah Logo/Foto'}
            </Btn>
            {d.punya_logo && (
              <Btn
                kecil
                bahaya
                onClick={async () => {
                  await api.ekskulHapusLogo(id).catch((e) => setError(e.message))
                  setVersi((v) => v + 1)
                  await muat()
                  onChanged()
                }}
              >
                Hapus
              </Btn>
            )}
          </div>
          <p className="text-[11px] text-navy/40 mt-1">JPG/PNG/WebP, maksimal 2 MB.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {[
          ['Pembina', d.pembina ?? '-'],
          ['Pelatih', d.pelatih ?? '-'],
          ['Jadwal rutin', d.hari ? `${d.hari}, ${d.jam_mulai ?? '-'}–${d.jam_selesai ?? '-'}` : 'Tidak rutin'],
          ['Tempat', d.tempat ?? '-'],
          ['Kuota', d.kuota ? `${d.terisi} / ${d.kuota} (sisa ${d.sisa_kuota})` : `${d.terisi} peserta (tanpa batas)`],
          ['Total keanggotaan (termasuk yang keluar)', d.jumlah_anggota_total],
          ['Jumlah kegiatan', d.jumlah_kegiatan],
          ['Persyaratan', d.persyaratan ?? '-'],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] text-navy/50">{k}</p>
            <p className="font-semibold text-navy">{v}</p>
          </div>
        ))}
        <div className="sm:col-span-2">
          <p className="text-[11px] text-navy/50">Aspek penilaian</p>
          <p className="font-semibold text-navy">{d.aspek_penilaian.length ? d.aspek_penilaian.join(', ') : 'Semua aspek bawaan'}</p>
        </div>
      </div>

      <h4 className="text-xs font-bold uppercase text-navy/50 mt-5 mb-2">Kegiatan mendatang</h4>
      {d.kegiatan_mendatang.length === 0 ? (
        <p className="text-xs text-navy/40">Belum ada kegiatan terjadwal.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {d.kegiatan_mendatang.map((k) => (
            <li key={k.id} className="flex justify-between gap-3 border-b border-navy/5 py-1">
              <span>
                {k.hari}, {tgl(k.tanggal)} · {k.jam}
              </span>
              <span className="text-navy/50 truncate">{k.materi || k.jenis}</span>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  )
}

function ModalDuplikasi({ opsi, filter, onClose, onSelesai }) {
  const [f, setF] = useState({ tahun_ajaran_sumber_id: '', semester_sumber: filter.semester || 'ganjil', tahun_ajaran_tujuan_id: filter.tahun_ajaran_id, semester_tujuan: filter.semester || 'ganjil' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))

  async function kirim() {
    setError('')
    try {
      const r = await api.ekskulDuplikasi({ ...f, tahun_ajaran_sumber_id: Number(f.tahun_ajaran_sumber_id), tahun_ajaran_tujuan_id: Number(f.tahun_ajaran_tujuan_id) })
      setInfo(r.message)
      onSelesai()
    } catch (e) {
      setError(e.message)
    }
  }

  const pilihTA = (k) => (
    <select value={f[k]} onChange={(e) => u(k, e.target.value)} className={input}>
      <option value="">Pilih tahun ajaran</option>
      {opsi.tahun_ajaran.map((t) => (
        <option key={t.id} value={t.id}>
          {t.nama}
        </option>
      ))}
    </select>
  )
  const pilihSem = (k) => (
    <select value={f[k]} onChange={(e) => u(k, e.target.value)} className={input}>
      <option value="ganjil">Ganjil</option>
      <option value="genap">Genap</option>
    </select>
  )

  return (
    <ModalShell title="Duplikasi dari Periode Sebelumnya" onClose={onClose} lebar="max-w-xl" footer={<Btn onClick={onClose}>Tutup</Btn>}>
      <Pesan error={error} info={info} />
      <p className="text-xs text-navy/50 mb-3">Menyalin data master (nama, kategori, pembina, jadwal rutin, kuota, aspek, logo). Peserta, kegiatan, dan nilai tidak ikut disalin. Nama yang sudah ada di tujuan dilewati.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tahun ajaran sumber">{pilihTA('tahun_ajaran_sumber_id')}</Field>
        <Field label="Semester sumber">{pilihSem('semester_sumber')}</Field>
        <Field label="Tahun ajaran tujuan">{pilihTA('tahun_ajaran_tujuan_id')}</Field>
        <Field label="Semester tujuan">{pilihSem('semester_tujuan')}</Field>
      </div>
      <div className="mt-4">
        <Btn utama disabled={!f.tahun_ajaran_sumber_id || !f.tahun_ajaran_tujuan_id} onClick={kirim}>
          Salin Ekstrakurikuler
        </Btn>
      </div>
    </ModalShell>
  )
}

export default function EkskulDaftarTab({ opsi, filter, onBerubah }) {
  const [data, setData] = useState(null)
  const [cari, setCari] = useState({ search: '', kategori: '', status: '', pembina_id: '' })
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [duplikasi, setDuplikasi] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const muat = useCallback(
    () =>
      api
        .ekskulList({ ...Object.fromEntries(Object.entries({ tahun_ajaran_id: filter.tahun_ajaran_id, semester: filter.semester, ...cari }).filter(([, v]) => v)) })
        .then((r) => {
          setData(r)
          setError('')
        })
        .catch((e) => setError(e.message)),
    [filter, cari],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  const selesai = () => {
    muat()
    onBerubah?.()
  }

  return (
    <div>
      <Pesan error={error} info={info} />
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <input value={cari.search} onChange={(e) => setCari((c) => ({ ...c, search: e.target.value }))} placeholder="Cari nama, pelatih, tempat…" className={`${selectClass} w-60`} />
        <select value={cari.kategori} onChange={(e) => setCari((c) => ({ ...c, kategori: e.target.value }))} className={selectClass}>
          <option value="">Semua kategori</option>
          {opsi.kategori.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
        <select value={cari.status} onChange={(e) => setCari((c) => ({ ...c, status: e.target.value }))} className={selectClass}>
          <option value="">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        <select value={cari.pembina_id} onChange={(e) => setCari((c) => ({ ...c, pembina_id: e.target.value }))} className={selectClass}>
          <option value="">Semua pembina</option>
          {opsi.guru.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
        <span className="flex-1" />
        <Btn onClick={() => setDuplikasi(true)}>Duplikasi Periode Lalu</Btn>
        <Btn utama disabled={!filter.tahun_ajaran_id} onClick={() => setForm({})}>
          + Tambah Ekstrakurikuler
        </Btn>
      </div>

      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : data.length === 0 ? (
        <Kosong>Belum ada ekstrakurikuler pada periode ini. Tambahkan atau duplikasi dari periode sebelumnya.</Kosong>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((e) => (
            <div key={e.id} className={`bg-white border border-navy/10 rounded-2xl p-4 flex flex-col ${e.status === 'nonaktif' ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <LogoEkskul id={e.id} ada={e.punya_logo} />
                <div className="min-w-0 flex-1">
                  <button onClick={() => setDetail(e.id)} className="text-left">
                    <p className="font-bold text-navy hover:underline truncate">{e.nama}</p>
                  </button>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${KATEGORI_TONE[e.kategori]}`}>{e.kategori_label}</span>
                    {e.status === 'nonaktif' && <Badge>Nonaktif</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-navy/60 space-y-1 flex-1">
                <p>Pembina: <span className="font-semibold text-navy">{e.pembina ?? '-'}</span>{e.pelatih ? ` · Pelatih: ${e.pelatih}` : ''}</p>
                <p>{e.hari ? `${e.hari}, ${e.jam_mulai ?? '-'}–${e.jam_selesai ?? '-'}` : 'Tidak ada jadwal rutin'}{e.tempat ? ` · ${e.tempat}` : ''}</p>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-navy/50 mb-1">
                  <span>Peserta</span>
                  <span className="font-semibold text-navy">
                    {e.terisi}
                    {e.kuota ? ` / ${e.kuota}` : ''}
                  </span>
                </div>
                {e.kuota && (
                  <div className="h-1.5 bg-navy/10 rounded-full overflow-hidden">
                    <div className={`h-full ${e.terisi >= e.kuota ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (e.terisi / e.kuota) * 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Btn kecil onClick={() => setDetail(e.id)}>
                  Detail
                </Btn>
                <Btn kecil onClick={() => api.ekskulGet(e.id).then(setForm).catch((x) => setError(x.message))}>
                  Edit
                </Btn>
                <Btn
                  kecil
                  onClick={async () => {
                    try {
                      await api.ekskulStatus(e.id, e.status === 'aktif' ? 'nonaktif' : 'aktif')
                      selesai()
                    } catch (x) {
                      setError(x.message)
                    }
                  }}
                >
                  {e.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                </Btn>
                <Btn
                  kecil
                  bahaya
                  onClick={async () => {
                    if (!window.confirm(`Hapus ${e.nama}? (hanya bisa bila belum punya peserta, kegiatan, atau nilai)`)) return
                    try {
                      await api.ekskulDelete(e.id)
                      setInfo('Ekstrakurikuler dihapus.')
                      selesai()
                    } catch (x) {
                      setError(x.message)
                    }
                  }}
                >
                  Hapus
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <FormEkskul
          opsi={opsi}
          filter={filter}
          ekskul={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={(baru) => {
            const tambah = !form.id
            setForm(null)
            setInfo('Ekstrakurikuler disimpan.')
            selesai()
            if (tambah) setDetail(baru.id)
          }}
        />
      )}
      {detail && <DetailEkskul id={detail} onClose={() => setDetail(null)} onChanged={selesai} />}
      {duplikasi && <ModalDuplikasi opsi={opsi} filter={filter} onClose={() => setDuplikasi(false)} onSelesai={selesai} />}
    </div>
  )
}
