import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, Kosong, ModalShell, Pagination, Pesan } from './PerpusUI'
import { inputClass, selectClass, TONE_STATUS_BUKU, TONE_STATUS_EKSEMPLAR, waktu } from './perpusKonstanta'

export default function PerpusBukuTab() {
  const [result, setResult] = useState(null)
  const [opsi, setOpsi] = useState({ kategori: [], penerbit: [], tahun_terbit: [] })
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [penerbit, setPenerbit] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [detailId, setDetailId] = useState(null)

  function load() {
    const params = { page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (kategori) params.kategori = kategori
    if (penerbit) params.penerbit = penerbit
    if (status) params.status = status
    api.perpusListBuku(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, kategori, penerbit, status])

  useEffect(() => {
    api.perpusOpsiBuku().then(setOpsi).catch(() => {})
  }, [])

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Koleksi Buku</h2>
          <p className="text-xs text-navy/50 mt-0.5">Master data judul buku beserta eksemplar fisiknya.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn onClick={() => api.perpusTemplateImportBuku().catch((e) => setError(e.message))}>Template Import</Btn>
          <Btn onClick={() => setShowImport(true)}>Import Excel</Btn>
          <Btn onClick={() => api.perpusExportBuku().catch((e) => setError(e.message))}>Export Excel</Btn>
          <Btn utama onClick={() => setShowForm(true)}>+ Tambah Buku</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Cari judul / penulis / ISBN…"
          className={`${selectClass} w-56`}
        />
        <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Kategori</option>
          {opsi.kategori.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <select value={penerbit} onChange={(e) => { setPenerbit(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Penerbit</option>
          {opsi.penerbit.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Penulis</th>
              <th className="px-4 py-3">Penerbit</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Eksemplar</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada buku.</td></tr>
            ) : (
              items.map((b) => (
                <tr key={b.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-semibold text-navy">{b.judul}</td>
                  <td className="px-4 py-3 text-navy/70">{b.penulis || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{b.penerbit || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{b.kategori || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{b.eksemplar_tersedia_count} / {b.eksemplar_count}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_BUKU[b.status]}>{b.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailId(b.id)} className="text-xs font-semibold text-navy-light hover:underline">Detail</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showForm && (
        <BukuFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
      {showImport && (
        <ImportBukuModal
          onClose={() => setShowImport(false)}
          onDone={() => {
            setShowImport(false)
            load()
          }}
        />
      )}
      {detailId && (
        <BukuDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          onChanged={() => {
            load()
            api.perpusOpsiBuku().then(setOpsi).catch(() => {})
          }}
        />
      )}
    </div>
  )
}

function BukuFormModal({ buku, onClose, onSaved }) {
  const [form, setForm] = useState({
    judul: buku?.judul ?? '',
    isbn: buku?.isbn ?? '',
    penulis: buku?.penulis ?? '',
    penerbit: buku?.penerbit ?? '',
    tahun_terbit: buku?.tahun_terbit ?? '',
    kategori: buku?.kategori ?? '',
    subjek: buku?.subjek ?? '',
    bahasa: buku?.bahasa ?? 'Indonesia',
    edisi: buku?.edisi ?? '',
    lokasi_rak: buku?.lokasi_rak ?? '',
    sinopsis: buku?.sinopsis ?? '',
    jumlah_eksemplar_awal: '',
  })
  const [cover, setCover] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null) formData.append(k, v)
      })
      if (cover) formData.append('cover', cover)

      if (buku) await api.perpusUpdateBuku(buku.id, formData)
      else await api.perpusCreateBuku(formData)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={buku ? 'Edit Buku' : 'Tambah Buku'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !form.judul} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Judul Buku *" className="col-span-2">
          <input value={form.judul} onChange={set('judul')} className={inputClass} />
        </Field>
        <Field label="ISBN">
          <input value={form.isbn} onChange={set('isbn')} className={inputClass} />
        </Field>
        <Field label="Penulis">
          <input value={form.penulis} onChange={set('penulis')} className={inputClass} />
        </Field>
        <Field label="Penerbit">
          <input value={form.penerbit} onChange={set('penerbit')} className={inputClass} />
        </Field>
        <Field label="Tahun Terbit">
          <input type="number" value={form.tahun_terbit} onChange={set('tahun_terbit')} className={inputClass} />
        </Field>
        <Field label="Kategori">
          <input value={form.kategori} onChange={set('kategori')} className={inputClass} />
        </Field>
        <Field label="Subjek">
          <input value={form.subjek} onChange={set('subjek')} className={inputClass} />
        </Field>
        <Field label="Bahasa">
          <input value={form.bahasa} onChange={set('bahasa')} className={inputClass} />
        </Field>
        <Field label="Edisi">
          <input value={form.edisi} onChange={set('edisi')} className={inputClass} />
        </Field>
        <Field label="Lokasi / Rak">
          <input value={form.lokasi_rak} onChange={set('lokasi_rak')} className={inputClass} />
        </Field>
        <Field label="Sinopsis / Deskripsi" className="col-span-2">
          <textarea value={form.sinopsis} onChange={set('sinopsis')} rows={3} className={inputClass} />
        </Field>
        <Field label="Cover Buku" className="col-span-2">
          <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>
        {!buku && (
          <Field label="Jumlah Eksemplar Awal" hint="Sistem akan membuat kode inventaris & barcode otomatis.">
            <input type="number" min="0" value={form.jumlah_eksemplar_awal} onChange={set('jumlah_eksemplar_awal')} className={inputClass} />
          </Field>
        )}
      </div>
    </ModalShell>
  )
}

function ImportBukuModal({ onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasil, setHasil] = useState(null)

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const r = await api.perpusImportBuku(file)
      setHasil(r)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title="Import Buku dari Excel"
      onClose={onClose}
      footer={
        hasil ? (
          <Btn utama onClick={onDone}>Selesai</Btn>
        ) : (
          <>
            <Btn onClick={onClose}>Batal</Btn>
            <Btn utama disabled={saving || !file} onClick={submit}>{saving ? 'Mengimpor...' : 'Import'}</Btn>
          </>
        )
      }
    >
      <Pesan error={error} />
      {hasil ? (
        <p className="text-sm text-navy">{hasil.masuk} buku berhasil diimpor.</p>
      ) : (
        <Field label="File Excel (.xlsx)" hint="Gunakan template import agar kolom sesuai.">
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>
      )}
    </ModalShell>
  )
}

function BukuDetailModal({ id, onClose, onChanged }) {
  const [buku, setBuku] = useState(null)
  const [tab, setTab] = useState('info')
  const [riwayat, setRiwayat] = useState(null)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [jumlahTambah, setJumlahTambah] = useState('')
  const [selected, setSelected] = useState([])

  function load() {
    api.perpusGetBuku(id).then(setBuku).catch((e) => setError(e.message))
  }

  useEffect(load, [id])

  useEffect(() => {
    if (tab === 'riwayat' && !riwayat) {
      api.perpusRiwayatBuku(id).then(setRiwayat).catch((e) => setError(e.message))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function tambahEksemplar() {
    try {
      await api.perpusTambahEksemplar(id, Number(jumlahTambah))
      setJumlahTambah('')
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  async function ubahStatusEksemplar(eksId, status) {
    try {
      await api.perpusUpdateEksemplar(eksId, { status })
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  async function hapusEksemplar(eksId) {
    if (!confirm('Hapus eksemplar ini?')) return
    try {
      await api.perpusHapusEksemplar(eksId)
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  async function nonaktifkanBuku() {
    if (!confirm(`Nonaktifkan buku "${buku.judul}"?`)) return
    try {
      await api.perpusNonaktifkanBuku(id)
      onChanged()
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  function toggleSelect(eksId) {
    setSelected((s) => (s.includes(eksId) ? s.filter((x) => x !== eksId) : [...s, eksId]))
  }

  if (!buku) {
    return (
      <ModalShell title="Detail Buku" onClose={onClose}>
        <Pesan error={error} />
        <Kosong>Memuat...</Kosong>
      </ModalShell>
    )
  }

  return (
    <ModalShell
      title={buku.judul}
      onClose={onClose}
      lebar="max-w-3xl"
      footer={
        <>
          <Btn bahaya onClick={nonaktifkanBuku}>Nonaktifkan Buku</Btn>
          <Btn onClick={() => setShowEdit(true)}>Edit</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {[['info', 'Informasi'], ['eksemplar', 'Eksemplar'], ['riwayat', 'Riwayat Perubahan']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <p><span className="text-navy/50">ISBN:</span> {buku.isbn || '-'}</p>
          <p><span className="text-navy/50">Penulis:</span> {buku.penulis || '-'}</p>
          <p><span className="text-navy/50">Penerbit:</span> {buku.penerbit || '-'}</p>
          <p><span className="text-navy/50">Tahun Terbit:</span> {buku.tahun_terbit || '-'}</p>
          <p><span className="text-navy/50">Kategori:</span> {buku.kategori || '-'}</p>
          <p><span className="text-navy/50">Subjek:</span> {buku.subjek || '-'}</p>
          <p><span className="text-navy/50">Bahasa:</span> {buku.bahasa || '-'}</p>
          <p><span className="text-navy/50">Edisi:</span> {buku.edisi || '-'}</p>
          <p><span className="text-navy/50">Lokasi/Rak:</span> {buku.lokasi_rak || '-'}</p>
          {buku.sinopsis && <p className="col-span-2"><span className="text-navy/50">Sinopsis:</span> {buku.sinopsis}</p>}
        </div>
      )}

      {tab === 'eksemplar' && (
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <input type="number" min="1" placeholder="Jumlah" value={jumlahTambah} onChange={(e) => setJumlahTambah(e.target.value)} className={`${inputClass} w-24`} />
            <Btn disabled={!jumlahTambah} onClick={tambahEksemplar}>+ Tambah Eksemplar</Btn>
            <Btn
              disabled={selected.length === 0}
              onClick={() => api.perpusCetakBarcode(selected).catch((e) => setError(e.message))}
            >
              Cetak Barcode ({selected.length})
            </Btn>
          </div>
          <div className="border border-navy/10 rounded-lg max-h-72 overflow-y-auto">
            {buku.eksemplar.length === 0 ? (
              <Kosong>Belum ada eksemplar.</Kosong>
            ) : (
              buku.eksemplar.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2 border-b border-navy/5 last:border-0 text-sm">
                  <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)} />
                  <span className="font-mono text-xs text-navy/70 w-28">{e.kode_inventaris}</span>
                  <span className="font-mono text-xs text-navy/50 w-32">{e.barcode}</span>
                  <select value={e.status} onChange={(ev) => ubahStatusEksemplar(e.id, ev.target.value)} className="text-xs border border-navy/15 rounded px-2 py-1">
                    <option value="tersedia">Tersedia</option>
                    <option value="dipinjam">Dipinjam</option>
                    <option value="rusak">Rusak</option>
                    <option value="hilang">Hilang</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                  <Badge tone={TONE_STATUS_EKSEMPLAR[e.status]}>{e.kondisi.replaceAll('_', ' ')}</Badge>
                  <button onClick={() => hapusEksemplar(e.id)} className="ml-auto text-xs text-red-600 hover:underline">Hapus</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'riwayat' && (
        !riwayat ? (
          <Kosong>Memuat riwayat…</Kosong>
        ) : riwayat.length === 0 ? (
          <Kosong>Belum ada riwayat perubahan.</Kosong>
        ) : (
          <ol className="space-y-3">
            {riwayat.map((r, i) => (
              <li key={i} className="border-l-2 border-navy/15 pl-3">
                <p className="text-sm text-navy">{r.keterangan}</p>
                <p className="text-[11px] text-navy/40">{waktu(r.waktu)} · {r.pengguna}</p>
              </li>
            ))}
          </ol>
        )
      )}

      {showEdit && (
        <BukuFormModal
          buku={buku}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
            load()
            onChanged()
          }}
        />
      )}
    </ModalShell>
  )
}
