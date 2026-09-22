import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { TONE_KEANGGOTAAN } from './ekskulKonstanta'
import { Badge, Btn, Field, Kosong, ModalShell, Pesan, RiwayatList } from './PpdbUI'
import { selectClass, tgl } from './ppdbKonstanta'

const input = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full bg-white'
const hariIni = () => new Date().toISOString().slice(0, 10)

function ModalDaftar({ daftarEkskul, awal, onClose, onSelesai }) {
  const aktif = daftarEkskul.filter((e) => e.status === 'aktif')
  const [ekskulId, setEkskulId] = useState(awal ? String(awal) : String(aktif[0]?.id ?? ''))
  const [search, setSearch] = useState('')
  const [siswa, setSiswa] = useState([])
  const [pilih, setPilih] = useState([])
  const [tanggal, setTanggal] = useState(hariIni())
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const e = aktif.find((x) => String(x.id) === ekskulId)

  useEffect(() => {
    if (!ekskulId) return
    const t = setTimeout(() => {
      api.ekskulSiswaTersedia({ ekskul_id: ekskulId, search }).then(setSiswa).catch((x) => setError(x.message))
    }, 250)
    return () => clearTimeout(t)
  }, [ekskulId, search])

  async function kirim() {
    setError('')
    try {
      const r = await api.ekskulTambahAnggota({ ekskul_id: Number(ekskulId), siswa_ids: pilih, tanggal_bergabung: tanggal })
      setInfo(r.message + (r.gagal.length ? ` Gagal: ${r.gagal.map((g) => `${g.siswa} (${g.alasan})`).join('; ')}` : ''))
      setPilih([])
      onSelesai()
      api.ekskulSiswaTersedia({ ekskul_id: ekskulId, search }).then(setSiswa)
    } catch (x) {
      setError(x.message)
    }
  }

  return (
    <ModalShell
      title="Daftarkan Siswa"
      onClose={onClose}
      lebar="max-w-2xl"
      footer={
        <>
          <Btn onClick={onClose}>Tutup</Btn>
          <Btn utama disabled={pilih.length === 0} onClick={kirim}>
            Daftarkan {pilih.length} Siswa
          </Btn>
        </>
      }
    >
      <Pesan error={error} info={info} />
      <div className="grid sm:grid-cols-3 gap-3 mb-3">
        <Field label="Ekstrakurikuler" className="sm:col-span-2">
          <select value={ekskulId} onChange={(x) => { setEkskulId(x.target.value); setPilih([]) }} className={input}>
            {aktif.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nama} ({x.semester === 'ganjil' ? 'Ganjil' : 'Genap'})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal bergabung">
          <input type="date" value={tanggal} onChange={(x) => setTanggal(x.target.value)} className={input} />
        </Field>
      </div>
      {e && (
        <p className={`text-xs mb-2 ${e.kuota && e.sisa_kuota < pilih.length ? 'text-red-600 font-semibold' : 'text-navy/50'}`}>
          {e.kuota ? `Sisa kuota ${e.sisa_kuota} dari ${e.kuota}. Terpilih ${pilih.length}.` : `Tanpa batas kuota. Terpilih ${pilih.length}.`}
          {e.persyaratan ? ` Persyaratan: ${e.persyaratan}` : ''}
        </p>
      )}
      <input value={search} onChange={(x) => setSearch(x.target.value)} placeholder="Cari nama / NIS / NISN siswa…" className={`${input} mb-2`} />
      <div className="border border-navy/10 rounded-xl max-h-72 overflow-y-auto divide-y divide-navy/5">
        {siswa.length === 0 && <p className="text-xs text-navy/40 text-center py-6">Tidak ada siswa tersedia.</p>}
        {siswa.map((s) => (
          <label key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-navy/[0.02] cursor-pointer">
            <input type="checkbox" checked={pilih.includes(s.id)} onChange={(x) => setPilih((p) => (x.target.checked ? [...p, s.id] : p.filter((i) => i !== s.id)))} />
            <span className="flex-1 font-semibold text-navy">{s.nama}</span>
            <span className="text-xs text-navy/50">
              {s.nis}
              {s.kelas ? ` · ${s.kelas}` : ''}
            </span>
          </label>
        ))}
      </div>
    </ModalShell>
  )
}

function ModalImport({ daftarEkskul, awal, onClose, onSelesai }) {
  const aktif = daftarEkskul.filter((e) => e.status === 'aktif')
  const [ekskulId, setEkskulId] = useState(awal ? String(awal) : String(aktif[0]?.id ?? ''))
  const [hasil, setHasil] = useState(null)
  const [error, setError] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const fileRef = useRef(null)

  async function kirim(file) {
    if (!file) return
    setSibuk(true)
    setError('')
    setHasil(null)
    try {
      setHasil(await api.ekskulImportAnggota(ekskulId, file))
      onSelesai()
    } catch (x) {
      setError(x.message)
    } finally {
      setSibuk(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <ModalShell title="Import Peserta" onClose={onClose} lebar="max-w-xl" footer={<Btn onClick={onClose}>Tutup</Btn>}>
      <Pesan error={error} />
      <p className="text-xs text-navy/50 mb-3">Unggah Excel/CSV dengan kolom NIS (dan opsional tanggal bergabung, format YYYY-MM-DD). Siswa harus sudah ada di Data Siswa; kuota tetap divalidasi per baris.</p>
      <Field label="Ekstrakurikuler tujuan">
        <select value={ekskulId} onChange={(x) => setEkskulId(x.target.value)} className={input}>
          {aktif.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nama} ({x.semester === 'ganjil' ? 'Ganjil' : 'Genap'})
            </option>
          ))}
        </select>
      </Field>
      <div className="flex gap-2 mt-3">
        <Btn onClick={() => api.ekskulTemplateAnggota().catch((x) => setError(x.message))}>Unduh Template</Btn>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(x) => kirim(x.target.files[0])} />
        <Btn utama disabled={!ekskulId || sibuk} onClick={() => fileRef.current?.click()}>
          {sibuk ? 'Mengimpor…' : 'Pilih File & Import'}
        </Btn>
      </div>
      {hasil && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-emerald-700">{hasil.message}</p>
          {hasil.gagal.length > 0 && (
            <ul className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 space-y-0.5 max-h-48 overflow-y-auto">
              {hasil.gagal.map((g, i) => (
                <li key={i}>
                  Baris {g.baris} ({g.nis}): {g.alasan}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ModalShell>
  )
}

function ModalPindah({ anggota, daftarEkskul, onClose, onSelesai }) {
  const opsi = daftarEkskul.filter((e) => e.status === 'aktif' && e.id !== anggota.ekskul.id)
  const [tujuan, setTujuan] = useState('')
  const [tanggal, setTanggal] = useState(hariIni())
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')
  const t = opsi.find((e) => String(e.id) === tujuan)

  async function kirim() {
    setError('')
    try {
      await api.ekskulPindahAnggota(anggota.id, { ekskul_tujuan_id: Number(tujuan), tanggal, alasan: alasan || null })
      onSelesai()
    } catch (x) {
      setError(x.message)
    }
  }

  return (
    <ModalShell
      title={`Pindahkan ${anggota.siswa.nama}`}
      onClose={onClose}
      lebar="max-w-md"
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={!tujuan} onClick={kirim}>
            Pindahkan
          </Btn>
        </>
      }
    >
      <Pesan error={error} />
      <p className="text-xs text-navy/50 mb-3">Dari <span className="font-semibold text-navy">{anggota.ekskul.nama}</span>. Keanggotaan lama ditutup dan tercatat di riwayat.</p>
      <div className="space-y-3">
        <Field label="Ekstrakurikuler tujuan">
          <select value={tujuan} onChange={(x) => setTujuan(x.target.value)} className={input}>
            <option value="">Pilih tujuan</option>
            {opsi.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nama} ({e.semester === 'ganjil' ? 'Ganjil' : 'Genap'}) — {e.kuota ? `sisa ${e.sisa_kuota}` : 'tanpa batas'}
              </option>
            ))}
          </select>
        </Field>
        {t && t.kuota && t.sisa_kuota === 0 && <p className="text-xs text-red-600">Kuota tujuan sudah penuh.</p>}
        <Field label="Tanggal pindah">
          <input type="date" value={tanggal} onChange={(x) => setTanggal(x.target.value)} className={input} />
        </Field>
        <Field label="Alasan (opsional)">
          <input value={alasan} onChange={(x) => setAlasan(x.target.value)} className={input} />
        </Field>
      </div>
    </ModalShell>
  )
}

function ModalRiwayat({ anggota, onClose }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.ekskulRiwayatAnggota({ siswa_id: anggota.siswa.id }).then(setD).catch((x) => setError(x.message))
  }, [anggota.siswa.id])
  return (
    <ModalShell title={`Riwayat Keanggotaan — ${anggota.siswa.nama}`} onClose={onClose} lebar="max-w-2xl">
      <Pesan error={error} />
      {!d ? (
        <Kosong>Memuat…</Kosong>
      ) : (
        <div className="space-y-5">
          <div className="border border-navy/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                  {['Ekstrakurikuler', 'Periode', 'Bergabung', 'Status', 'Keluar / Pindah'].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {d.keanggotaan.map((k) => (
                  <tr key={k.id}>
                    <td className="px-3 py-2 font-semibold text-navy">{k.ekskul.nama}</td>
                    <td className="px-3 py-2 text-xs">
                      {k.ekskul.tahun_ajaran} {k.ekskul.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                    </td>
                    <td className="px-3 py-2">{tgl(k.tanggal_bergabung)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={TONE_KEANGGOTAAN[k.status]}>{k.status_label}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-navy/60">
                      {k.tanggal_keluar ? tgl(k.tanggal_keluar) : '-'}
                      {k.dipindah_ke ? ` → ${k.dipindah_ke}` : ''}
                      {k.alasan_keluar ? ` · ${k.alasan_keluar}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-navy/50 mb-2">Log perubahan</h4>
            <RiwayatList items={d.log} />
          </div>
        </div>
      )}
    </ModalShell>
  )
}

export default function EkskulPesertaTab({ filter, daftarEkskul, onBerubah }) {
  const [f, setF] = useState({ ekskul_id: '', kelas_id: '', status: '', search: '' })
  const [halaman, setHalaman] = useState(1)
  const [data, setData] = useState(null)
  const [kelas, setKelas] = useState([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [modal, setModal] = useState(null)

  const params = { tahun_ajaran_id: filter.tahun_ajaran_id, semester: filter.semester, ...f }
  const bersih = Object.fromEntries(Object.entries(params).filter(([, v]) => v))

  const muat = useCallback(
    () =>
      api
        .ekskulAnggota({ ...bersih, page: halaman, per_page: 25 })
        .then((r) => {
          setData(r)
          setError('')
        })
        .catch((e) => setError(e.message)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(bersih), halaman],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])
  useEffect(() => {
    api.listKelasAll().then((r) => setKelas(r.data ?? r)).catch(() => {})
  }, [])

  const set = (k, v) => {
    setHalaman(1)
    setF((x) => ({ ...x, [k]: v }))
  }
  const selesai = () => {
    muat()
    onBerubah?.()
  }

  return (
    <div>
      <Pesan error={error} info={info} />
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <input value={f.search} onChange={(e) => set('search', e.target.value)} placeholder="Cari nama / NIS / NISN…" className={`${selectClass} w-56`} />
        <select value={f.ekskul_id} onChange={(e) => set('ekskul_id', e.target.value)} className={selectClass}>
          <option value="">Semua ekstrakurikuler</option>
          {daftarEkskul.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nama} ({e.semester === 'ganjil' ? 'Ganjil' : 'Genap'})
            </option>
          ))}
        </select>
        <select value={f.kelas_id} onChange={(e) => set('kelas_id', e.target.value)} className={selectClass}>
          <option value="">Semua kelas/rombel</option>
          {kelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama_kelas}
            </option>
          ))}
        </select>
        <select value={f.status} onChange={(e) => set('status', e.target.value)} className={selectClass}>
          <option value="">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="keluar">Keluar</option>
          <option value="pindah">Pindah</option>
        </select>
        <span className="flex-1" />
        <Btn onClick={() => api.ekskulExportAnggota(bersih).catch((e) => setError(e.message))}>Export Excel</Btn>
        <Btn onClick={() => setModal({ jenis: 'import' })}>Import</Btn>
        <Btn utama onClick={() => setModal({ jenis: 'daftar' })}>
          + Daftarkan Siswa
        </Btn>
      </div>

      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                {['Siswa', 'NIS / NISN', 'Kelas', 'Rombel', 'Ekstrakurikuler', 'Periode', 'Bergabung', 'Status', ''].map((h) => (
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
                    Belum ada peserta yang sesuai.
                  </td>
                </tr>
              )}
              {data.data.map((a) => (
                <tr key={a.id} className={a.status === 'aktif' ? '' : 'opacity-60'}>
                  <td className="px-3 py-2 font-semibold text-navy">{a.siswa.nama}</td>
                  <td className="px-3 py-2 text-xs text-navy/60">
                    {a.siswa.nis}
                    {a.siswa.nisn ? ` / ${a.siswa.nisn}` : ''}
                  </td>
                  <td className="px-3 py-2">{a.kelas ?? '-'}</td>
                  <td className="px-3 py-2">{a.rombel ?? '-'}</td>
                  <td className="px-3 py-2">{a.ekskul.nama}</td>
                  <td className="px-3 py-2 text-xs text-navy/60">
                    {a.ekskul.tahun_ajaran} {a.ekskul.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                  </td>
                  <td className="px-3 py-2 text-xs">{tgl(a.tanggal_bergabung)}</td>
                  <td className="px-3 py-2">
                    <Badge tone={TONE_KEANGGOTAAN[a.status]}>{a.status_label}</Badge>
                    {a.tanggal_keluar && <p className="text-[10px] text-navy/40 mt-0.5">{tgl(a.tanggal_keluar)}</p>}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                    {a.status === 'aktif' && (
                      <>
                        <Btn kecil onClick={() => setModal({ jenis: 'pindah', a })}>
                          Pindah
                        </Btn>
                        <Btn
                          kecil
                          bahaya
                          onClick={async () => {
                            const alasan = window.prompt(`Alasan mengeluarkan ${a.siswa.nama} dari ${a.ekskul.nama}:`)
                            if (!alasan) return
                            try {
                              await api.ekskulKeluarAnggota(a.id, { alasan })
                              setInfo('Siswa dikeluarkan.')
                              selesai()
                            } catch (x) {
                              setError(x.message)
                            }
                          }}
                        >
                          Keluarkan
                        </Btn>
                      </>
                    )}
                    <Btn kecil onClick={() => setModal({ jenis: 'riwayat', a })}>
                      Riwayat
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-3 py-2 border-t border-navy/5 text-xs text-navy/50">
            <span>{data.total} keanggotaan</span>
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

      {modal?.jenis === 'daftar' && <ModalDaftar daftarEkskul={daftarEkskul} awal={f.ekskul_id} onClose={() => setModal(null)} onSelesai={selesai} />}
      {modal?.jenis === 'import' && <ModalImport daftarEkskul={daftarEkskul} awal={f.ekskul_id} onClose={() => setModal(null)} onSelesai={selesai} />}
      {modal?.jenis === 'pindah' && (
        <ModalPindah
          anggota={modal.a}
          daftarEkskul={daftarEkskul}
          onClose={() => setModal(null)}
          onSelesai={() => {
            setModal(null)
            setInfo('Siswa dipindahkan.')
            selesai()
          }}
        />
      )}
      {modal?.jenis === 'riwayat' && <ModalRiwayat anggota={modal.a} onClose={() => setModal(null)} />}
    </div>
  )
}
