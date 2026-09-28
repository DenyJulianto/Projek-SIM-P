import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, ModalShell, Pagination, Pesan } from './LabUI'
import { inputClass, KONDISI_ALAT, LABEL_KONDISI_ALAT, rupiah, selectClass, TONE_KONDISI_ALAT } from './labKonstanta'

export default function LabPeralatanTab() {
  const [result, setResult] = useState(null)
  const [opsi, setOpsi] = useState({ kategori: [], laboratorium: [] })
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [laboratoriumId, setLaboratoriumId] = useState('')
  const [kondisi, setKondisi] = useState('')
  const [showForm, setShowForm] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [selected, setSelected] = useState([])

  function load() {
    const params = { page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (laboratoriumId) params.laboratorium_id = laboratoriumId
    if (kondisi) params.kondisi = kondisi
    api.labListPeralatan(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, laboratoriumId, kondisi])

  useEffect(() => {
    api.labOpsiPeralatan().then(setOpsi).catch(() => {})
  }, [])

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Peralatan &amp; Inventaris Laboratorium</h2>
          <p className="text-xs text-navy/50 mt-0.5">Terhubung dengan data Sarpras &gt; Inventaris — bukan data terpisah.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn onClick={() => api.labTemplateImportPeralatan().catch((e) => setError(e.message))}>Template Import</Btn>
          <Btn onClick={() => setShowImport(true)}>Import Excel</Btn>
          <Btn onClick={() => api.labExportPeralatan().catch((e) => setError(e.message))}>Export Excel</Btn>
          <Btn disabled={selected.length === 0} onClick={() => api.labCetakBarcodePeralatan(selected).catch((e) => setError(e.message))}>Cetak Barcode ({selected.length})</Btn>
          <Btn utama onClick={() => setShowForm({})}>+ Tambah Alat</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Cari nama / kode / barcode…" className={`${selectClass} w-56`} />
        <select value={laboratoriumId} onChange={(e) => { setLaboratoriumId(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Laboratorium</option>
          {opsi.laboratorium.map((l) => (
            <option key={l.id} value={l.id}>{l.nama}</option>
          ))}
        </select>
        <select value={kondisi} onChange={(e) => { setKondisi(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Kondisi</option>
          {KONDISI_ALAT.map((k) => (
            <option key={k} value={k}>{LABEL_KONDISI_ALAT[k]}</option>
          ))}
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Nama Alat</th>
              <th className="px-4 py-3">Laboratorium</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Tersedia</th>
              <th className="px-4 py-3">Kondisi</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada peralatan.</td></tr>
            ) : (
              items.map((i) => {
                const kondisiTampil = i.kondisi_lab || i.kondisi
                return (
                  <tr key={i.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(i.id)} onChange={() => toggleSelect(i.id)} /></td>
                    <td className="px-4 py-3 font-semibold text-navy">{i.nama_barang}</td>
                    <td className="px-4 py-3 text-navy/70">{i.laboratorium?.nama || '-'}</td>
                    <td className="px-4 py-3 text-navy/70">{i.jumlah}</td>
                    <td className="px-4 py-3 text-navy/70">{i.jumlah_tersedia}</td>
                    <td className="px-4 py-3"><Badge tone={TONE_KONDISI_ALAT[kondisiTampil]}>{LABEL_KONDISI_ALAT[kondisiTampil] ?? kondisiTampil}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDetailId(i.id)} className="text-xs font-semibold text-navy-light hover:underline">Detail</button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showForm && (
        <PeralatanFormModal
          peralatan={showForm.id ? showForm : null}
          opsi={opsi}
          onClose={() => setShowForm(null)}
          onSaved={() => {
            setShowForm(null)
            load()
            api.labOpsiPeralatan().then(setOpsi).catch(() => {})
          }}
        />
      )}
      {showImport && (
        <ImportPeralatanModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load() }} />
      )}
      {detailId && (
        <PeralatanDetailModal
          id={detailId}
          opsi={opsi}
          onClose={() => setDetailId(null)}
          onEdit={(p) => { setDetailId(null); setShowForm(p) }}
          onChanged={load}
        />
      )}
    </div>
  )
}

function PeralatanFormModal({ peralatan, opsi, onClose, onSaved }) {
  const [form, setForm] = useState({
    nama_barang: peralatan?.nama_barang ?? '',
    kategori: peralatan?.kategori ?? '',
    merk: peralatan?.merk ?? '',
    tipe_model: peralatan?.tipe_model ?? '',
    nomor_seri: peralatan?.nomor_seri ?? '',
    tahun_pengadaan: peralatan?.tahun_pengadaan ?? '',
    sumber_dana: peralatan?.sumber_dana ?? '',
    jumlah: peralatan?.jumlah ?? 1,
    satuan: peralatan?.satuan ?? 'unit',
    laboratorium_id: peralatan?.laboratorium_id ?? '',
    lokasi: peralatan?.lokasi ?? '',
    kondisi_lab: peralatan?.kondisi_lab ?? 'baik',
    harga: peralatan?.harga ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const data = { ...form }
      if (peralatan) await api.labUpdatePeralatan(peralatan.id, data)
      else await api.labCreatePeralatan(data)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={peralatan ? 'Edit Peralatan' : 'Tambah Peralatan'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !form.nama_barang || !form.laboratorium_id} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama Alat *" className="col-span-2">
          <input value={form.nama_barang} onChange={set('nama_barang')} className={inputClass} />
        </Field>
        <Field label="Laboratorium *">
          <select value={form.laboratorium_id} onChange={set('laboratorium_id')} className={selectClass + ' w-full'}>
            <option value="">— Pilih —</option>
            {opsi.laboratorium.map((l) => (
              <option key={l.id} value={l.id}>{l.nama}</option>
            ))}
          </select>
        </Field>
        <Field label="Kategori">
          <input value={form.kategori} onChange={set('kategori')} className={inputClass} />
        </Field>
        <Field label="Merk">
          <input value={form.merk} onChange={set('merk')} className={inputClass} />
        </Field>
        <Field label="Tipe/Model">
          <input value={form.tipe_model} onChange={set('tipe_model')} className={inputClass} />
        </Field>
        <Field label="Nomor Seri">
          <input value={form.nomor_seri} onChange={set('nomor_seri')} className={inputClass} />
        </Field>
        <Field label="Tahun Pengadaan">
          <input type="number" value={form.tahun_pengadaan} onChange={set('tahun_pengadaan')} className={inputClass} />
        </Field>
        <Field label="Sumber Dana">
          <input value={form.sumber_dana} onChange={set('sumber_dana')} className={inputClass} />
        </Field>
        <Field label="Jumlah *">
          <input type="number" min="1" value={form.jumlah} onChange={set('jumlah')} className={inputClass} />
        </Field>
        <Field label="Satuan">
          <input value={form.satuan} onChange={set('satuan')} className={inputClass} />
        </Field>
        <Field label="Lokasi/Rak">
          <input value={form.lokasi} onChange={set('lokasi')} className={inputClass} />
        </Field>
        <Field label="Harga Satuan (Rp)">
          <input type="number" min="0" value={form.harga} onChange={set('harga')} className={inputClass} />
        </Field>
        <Field label="Kondisi" className="col-span-2">
          <select value={form.kondisi_lab} onChange={set('kondisi_lab')} className={selectClass + ' w-full'}>
            {KONDISI_ALAT.map((k) => (
              <option key={k} value={k}>{LABEL_KONDISI_ALAT[k]}</option>
            ))}
          </select>
        </Field>
      </div>
    </ModalShell>
  )
}

function ImportPeralatanModal({ onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasil, setHasil] = useState(null)

  async function submit() {
    setSaving(true)
    setError('')
    try {
      setHasil(await api.labImportPeralatan(file))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title="Import Peralatan dari Excel"
      onClose={onClose}
      footer={
        hasil ? <Btn utama onClick={onDone}>Selesai</Btn> : (
          <>
            <Btn onClick={onClose}>Batal</Btn>
            <Btn utama disabled={saving || !file} onClick={submit}>{saving ? 'Mengimpor...' : 'Import'}</Btn>
          </>
        )
      }
    >
      <Pesan error={error} />
      {hasil ? (
        <p className="text-sm text-navy">{hasil.masuk} peralatan berhasil diimpor.</p>
      ) : (
        <Field label="File Excel (.xlsx)" hint="Gunakan template import — kolom ID Laboratorium wajib diisi.">
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>
      )}
    </ModalShell>
  )
}

function PeralatanDetailModal({ id, opsi, onClose, onEdit, onChanged }) {
  const [p, setP] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('info')
  const [jumlahUbah, setJumlahUbah] = useState('')
  const [mutasiLab, setMutasiLab] = useState('')
  const [mutasiLokasi, setMutasiLokasi] = useState('')

  function load() {
    api.labGetPeralatan(id).then(setP).catch((e) => setError(e.message))
  }

  useEffect(load, [id])

  async function nonaktifkan() {
    if (!confirm(`Nonaktifkan "${p.nama_barang}"?`)) return
    try {
      await api.labNonaktifkanPeralatan(id)
      onChanged()
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  async function tambah() {
    try {
      await api.labTambahJumlahPeralatan(id, Number(jumlahUbah))
      setJumlahUbah('')
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  async function kurangi() {
    try {
      await api.labKurangiJumlahPeralatan(id, Number(jumlahUbah))
      setJumlahUbah('')
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  async function mutasi() {
    try {
      await api.labMutasiPeralatan(id, { laboratorium_id: mutasiLab || undefined, lokasi: mutasiLokasi || undefined })
      setMutasiLab('')
      setMutasiLokasi('')
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!p) {
    return (
      <ModalShell title="Detail Peralatan" onClose={onClose}>
        <Pesan error={error} />
      </ModalShell>
    )
  }

  return (
    <ModalShell
      title={p.nama_barang}
      onClose={onClose}
      lebar="max-w-2xl"
      footer={
        <>
          <Btn bahaya onClick={nonaktifkan}>Nonaktifkan</Btn>
          <Btn onClick={() => onEdit(p)}>Edit</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {[['info', 'Informasi'], ['stok', 'Stok & Mutasi'], ['riwayat', 'Riwayat']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <p><span className="text-navy/50">Kode Inventaris:</span> {p.kode_barang || '-'}</p>
          <p><span className="text-navy/50">Barcode:</span> {p.barcode || '-'}</p>
          <p><span className="text-navy/50">Kategori:</span> {p.kategori || '-'}</p>
          <p><span className="text-navy/50">Merk / Tipe:</span> {p.merk || '-'} {p.tipe_model || ''}</p>
          <p><span className="text-navy/50">Nomor Seri:</span> {p.nomor_seri || '-'}</p>
          <p><span className="text-navy/50">Tahun Pengadaan:</span> {p.tahun_pengadaan || '-'}</p>
          <p><span className="text-navy/50">Sumber Dana:</span> {p.sumber_dana || '-'}</p>
          <p><span className="text-navy/50">Harga:</span> {p.harga ? rupiah(p.harga) : '-'}</p>
          <p><span className="text-navy/50">Laboratorium:</span> {p.laboratorium?.nama || '-'}</p>
          <p><span className="text-navy/50">Lokasi/Rak:</span> {p.lokasi || '-'}</p>
          <p><span className="text-navy/50">Jumlah:</span> {p.jumlah} {p.satuan}</p>
          <p><span className="text-navy/50">Tersedia:</span> {p.jumlah_tersedia}</p>
        </div>
      )}

      {tab === 'stok' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-navy/60 mb-1">Tambah / Kurangi Jumlah</p>
            <div className="flex gap-2">
              <input type="number" min="1" value={jumlahUbah} onChange={(e) => setJumlahUbah(e.target.value)} className={`${inputClass} w-28`} placeholder="Jumlah" />
              <Btn disabled={!jumlahUbah} onClick={tambah}>+ Tambah</Btn>
              <Btn disabled={!jumlahUbah} onClick={kurangi}>− Kurangi</Btn>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-navy/60 mb-1">Mutasi Lokasi</p>
            <div className="flex gap-2 flex-wrap">
              <select value={mutasiLab} onChange={(e) => setMutasiLab(e.target.value)} className={selectClass}>
                <option value="">Lab tetap</option>
                {opsi.laboratorium.map((l) => (
                  <option key={l.id} value={l.id}>{l.nama}</option>
                ))}
              </select>
              <input value={mutasiLokasi} onChange={(e) => setMutasiLokasi(e.target.value)} placeholder="Rak/lokasi baru" className={`${inputClass} w-40`} />
              <Btn disabled={!mutasiLab && !mutasiLokasi} onClick={mutasi}>Simpan Mutasi</Btn>
            </div>
          </div>
        </div>
      )}

      {tab === 'riwayat' && (
        !p.riwayat || p.riwayat.length === 0 ? (
          <p className="text-xs text-navy/40">Belum ada riwayat.</p>
        ) : (
          <ol className="space-y-2">
            {p.riwayat.map((r) => (
              <li key={r.id} className="border-l-2 border-navy/15 pl-3">
                <p className="text-sm text-navy">{r.keterangan} {r.biaya ? `(${rupiah(r.biaya)})` : ''}</p>
                <p className="text-[11px] text-navy/40">{r.tanggal} · {r.user?.name ?? 'Sistem'}</p>
              </li>
            ))}
          </ol>
        )
      )}
    </ModalShell>
  )
}
