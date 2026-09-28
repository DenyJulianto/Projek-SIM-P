import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, ModalShell, Pagination, Pesan } from './LabUI'
import { inputClass, KONDISI_ALAT, LABEL_KONDISI_ALAT, LABEL_STATUS_PEMINJAMAN_ALAT, selectClass, tgl, TONE_STATUS_PEMINJAMAN_ALAT } from './labKonstanta'

export default function LabPeminjamanTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState(null)

  function load() {
    const params = { page, per_page: 15 }
    if (status) params.status = status
    api.labListPeminjamanAlat(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(load, [page, status])

  async function aksi(fn, id, ...args) {
    setError('')
    setInfo('')
    try {
      await fn(id, ...args)
      setInfo('Berhasil diperbarui.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Peminjaman Alat</h2>
          <p className="text-xs text-navy/50 mt-0.5">Peminjaman alat untuk digunakan di luar laboratorium (berbeda dari Jadwal Penggunaan).</p>
        </div>
        <Btn utama onClick={() => setShowForm(true)}>+ Ajukan Peminjaman</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          {Object.entries(LABEL_STATUS_PEMINJAMAN_ALAT).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
        </select>
      </div>

      <Pesan error={error} info={info} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nomor Transaksi</th>
              <th className="px-4 py-3">Peminjam</th>
              <th className="px-4 py-3">Alat</th>
              <th className="px-4 py-3">Tgl Pinjam</th>
              <th className="px-4 py-3">Rencana Kembali</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada peminjaman alat.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-navy/70">{p.nomor_transaksi}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{p.peminjam?.name} <span className="text-xs text-navy/40">({p.jabatan_kelas})</span></td>
                  <td className="px-4 py-3 text-navy/70">{p.item.map((it) => it.inventaris.nama_barang).join(', ')}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(p.tanggal_pinjam)}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(p.tanggal_kembali_rencana)}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_PEMINJAMAN_ALAT[p.status_efektif ?? p.status]}>{LABEL_STATUS_PEMINJAMAN_ALAT[p.status_efektif ?? p.status]}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {p.status === 'diajukan' && (
                      <>
                        <button onClick={() => aksi(api.labSetujuiPeminjamanAlat, p.id)} className="text-xs font-semibold text-navy-light hover:underline">Setujui</button>
                        <button onClick={() => aksi(api.labTolakPeminjamanAlat, p.id)} className="text-xs font-semibold text-red-600 hover:underline">Tolak</button>
                      </>
                    )}
                    {p.status === 'disetujui' && (
                      <button onClick={() => aksi(api.labAmbilPeminjamanAlat, p.id)} className="text-xs font-semibold text-navy-light hover:underline">Serahkan Alat</button>
                    )}
                    {(p.status === 'dipinjam' || p.status_efektif === 'terlambat') && (
                      <button onClick={() => setDetailId(p.id)} className="text-xs font-semibold text-navy-light hover:underline">Kembalikan</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showForm && (
        <PeminjamanFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
      {detailId && (
        <PengembalianAlatModal id={detailId} onClose={() => setDetailId(null)} onSaved={() => { setDetailId(null); load() }} />
      )}
    </div>
  )
}

function PeminjamanFormModal({ onClose, onSaved }) {
  const [jabatanKelas, setJabatanKelas] = useState('')
  const [tujuan, setTujuan] = useState('')
  const [tanggalPinjam, setTanggalPinjam] = useState(new Date().toISOString().slice(0, 10))
  const [tanggalKembali, setTanggalKembali] = useState('')
  const [barcode, setBarcode] = useState('')
  const [keranjang, setKeranjang] = useState([])
  const [jumlah, setJumlah] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function cariAlat() {
    setError('')
    try {
      const alat = await api.labCariAlatBarcode(barcode)
      if (keranjang.some((k) => k.id === alat.id)) {
        setError('Alat ini sudah ada di keranjang.')
        return
      }
      setKeranjang((k) => [...k, { ...alat, jumlahPinjam: Math.min(jumlah, alat.jumlah_tersedia) }])
      setBarcode('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await api.labAjukanPeminjamanAlat({
        jabatan_kelas: jabatanKelas || undefined,
        tujuan_penggunaan: tujuan || undefined,
        tanggal_pinjam: tanggalPinjam,
        tanggal_kembali_rencana: tanggalKembali,
        items: keranjang.map((k) => ({ inventaris_id: k.id, jumlah: k.jumlahPinjam })),
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title="Ajukan Peminjaman Alat"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || keranjang.length === 0 || !tanggalKembali} onClick={submit}>{saving ? 'Menyimpan...' : 'Ajukan'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Jabatan/Kelas Peminjam">
          <input value={jabatanKelas} onChange={(e) => setJabatanKelas(e.target.value)} className={inputClass} placeholder="Contoh: Guru IPA / Kelas VIII-A" />
        </Field>
        <Field label="Tujuan Penggunaan">
          <input value={tujuan} onChange={(e) => setTujuan(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Tanggal Pinjam">
          <input type="date" value={tanggalPinjam} onChange={(e) => setTanggalPinjam(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Rencana Tanggal Kembali *">
          <input type="date" value={tanggalKembali} onChange={(e) => setTanggalKembali(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Scan/Cari Barcode Alat" className="mb-3">
        <div className="flex gap-2">
          <input value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cariAlat()} className={inputClass} />
          <input type="number" min="1" value={jumlah} onChange={(e) => setJumlah(Number(e.target.value))} className={`${inputClass} w-20`} />
          <Btn onClick={cariAlat}>+ Tambah</Btn>
        </div>
      </Field>

      <div className="border border-navy/10 rounded-lg divide-y divide-navy/5 max-h-48 overflow-y-auto">
        {keranjang.length === 0 ? (
          <p className="text-xs text-navy/40 p-3">Belum ada alat ditambahkan.</p>
        ) : (
          keranjang.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-navy">{k.nama_barang} × {k.jumlahPinjam} <span className="text-xs text-navy/40">(tersedia {k.jumlah_tersedia})</span></span>
              <button onClick={() => setKeranjang((arr) => arr.filter((x) => x.id !== k.id))} className="text-xs text-red-600 hover:underline">Hapus</button>
            </div>
          ))
        )}
      </div>
    </ModalShell>
  )
}

function PengembalianAlatModal({ id, onClose, onSaved }) {
  const [p, setP] = useState(null)
  const [kondisi, setKondisi] = useState({})
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.labGetPeminjamanAlat(id).then((r) => {
      setP(r)
      const awal = {}
      r.item.forEach((it) => { awal[it.id] = 'baik' })
      setKondisi(awal)
    }).catch((e) => setError(e.message))
  }, [id])

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await api.labKembalikanPeminjamanAlat(id, Object.entries(kondisi).map(([itemId, k]) => ({ peminjaman_alat_item_id: Number(itemId), kondisi_setelah: k })), catatan || undefined)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!p) {
    return (
      <ModalShell title="Pengembalian Alat" onClose={onClose}>
        <Pesan error={error} />
      </ModalShell>
    )
  }

  return (
    <ModalShell
      title={`Pengembalian — ${p.nomor_transaksi}`}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving} onClick={submit}>{saving ? 'Menyimpan...' : 'Konfirmasi Pengembalian'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="space-y-3 mb-3">
        {p.item.map((it) => (
          <div key={it.id} className="border border-navy/10 rounded-lg p-3">
            <p className="text-sm font-semibold text-navy mb-2">{it.inventaris.nama_barang} × {it.jumlah}</p>
            <select value={kondisi[it.id]} onChange={(e) => setKondisi((k) => ({ ...k, [it.id]: e.target.value }))} className={selectClass}>
              {KONDISI_ALAT.map((k) => (<option key={k} value={k}>{LABEL_KONDISI_ALAT[k]}</option>))}
            </select>
          </div>
        ))}
      </div>
      <Field label="Catatan Kerusakan (jika ada)">
        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} className={inputClass} />
      </Field>
    </ModalShell>
  )
}
