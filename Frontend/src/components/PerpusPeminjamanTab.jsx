import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, Kosong, ModalShell, Pagination, Pesan } from './PerpusUI'
import { inputClass, selectClass, tgl, TONE_STATUS_PEMINJAMAN } from './perpusKonstanta'

export default function PerpusPeminjamanTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState(null)

  function load() {
    const params = { page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (status) params.status = status
    api.perpusListPeminjaman(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status])

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Peminjaman Buku</h2>
          <p className="text-xs text-navy/50 mt-0.5">Catat peminjaman baru untuk satu atau beberapa buku sekaligus.</p>
        </div>
        <Btn utama onClick={() => setShowForm(true)}>+ Peminjaman Baru</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari nomor transaksi…"
          className={`${selectClass} w-56`}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="dipinjam">Dipinjam</option>
          <option value="sebagian_kembali">Sebagian Kembali</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nomor Transaksi</th>
              <th className="px-4 py-3">Anggota</th>
              <th className="px-4 py-3">Buku</th>
              <th className="px-4 py-3">Tgl Pinjam</th>
              <th className="px-4 py-3">Jatuh Tempo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada peminjaman.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-navy/70">{p.nomor_transaksi}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{p.anggota?.nama}</td>
                  <td className="px-4 py-3 text-navy/70">{p.item.length} judul</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(p.tanggal_pinjam)}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(p.tanggal_jatuh_tempo)}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_PEMINJAMAN[p.status]}>{p.status.replaceAll('_', ' ')}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailId(p.id)} className="text-xs font-semibold text-navy-light hover:underline">Detail</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showForm && (
        <PeminjamanFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
      {detailId && <PeminjamanDetailModal id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  )
}

function PeminjamanFormModal({ onClose, onSaved }) {
  const [nomorKartu, setNomorKartu] = useState('')
  const [anggota, setAnggota] = useState(null)
  const [barcode, setBarcode] = useState('')
  const [keranjang, setKeranjang] = useState([])
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function cariAnggota() {
    setError('')
    try {
      setAnggota(await api.perpusCariKartuAnggota(nomorKartu))
    } catch (err) {
      setAnggota(null)
      setError(err.message)
    }
  }

  async function tambahEksemplar() {
    setError('')
    try {
      const e = await api.perpusCariEksemplarBarcode(barcode)
      if (keranjang.some((k) => k.id === e.id)) {
        setError('Eksemplar ini sudah ada di keranjang.')
        return
      }
      setKeranjang((k) => [...k, e])
      setBarcode('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await api.perpusBuatPeminjaman({
        anggota_id: anggota.id,
        eksemplar_ids: keranjang.map((k) => k.id),
        tanggal_jatuh_tempo: tanggalJatuhTempo || undefined,
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
      title="Peminjaman Buku Baru"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !anggota || keranjang.length === 0} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan Peminjaman'}</Btn>
        </>
      }
    >
      <Pesan error={error} />

      <Field label="Nomor Kartu Anggota (scan / ketik)" className="mb-3">
        <div className="flex gap-2">
          <input
            value={nomorKartu}
            onChange={(e) => setNomorKartu(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cariAnggota()}
            className={inputClass}
            placeholder="Contoh: SIS-00001"
          />
          <Btn onClick={cariAnggota}>Cari</Btn>
        </div>
      </Field>
      {anggota && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
          {anggota.nama} — {anggota.nomor_kartu}
        </p>
      )}

      <Field label="Barcode Buku (scan / ketik)" className="mb-3">
        <div className="flex gap-2">
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tambahEksemplar()}
            className={inputClass}
          />
          <Btn onClick={tambahEksemplar}>+ Tambah</Btn>
        </div>
      </Field>

      <div className="border border-navy/10 rounded-lg divide-y divide-navy/5 mb-3 max-h-48 overflow-y-auto">
        {keranjang.length === 0 ? (
          <p className="text-xs text-navy/40 p-3">Belum ada buku ditambahkan.</p>
        ) : (
          keranjang.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-navy">{k.buku.judul} <span className="text-xs text-navy/40">({k.kode_inventaris})</span></span>
              <button onClick={() => setKeranjang((arr) => arr.filter((x) => x.id !== k.id))} className="text-xs text-red-600 hover:underline">Hapus</button>
            </div>
          ))
        )}
      </div>

      <Field label="Tanggal Jatuh Tempo" hint="Kosongkan untuk memakai default 7 hari.">
        <input type="date" value={tanggalJatuhTempo} onChange={(e) => setTanggalJatuhTempo(e.target.value)} className={inputClass} />
      </Field>
    </ModalShell>
  )
}

function PeminjamanDetailModal({ id, onClose, onChanged }) {
  const [p, setP] = useState(null)
  const [error, setError] = useState('')
  const [tanggalBaru, setTanggalBaru] = useState('')

  function load() {
    api.perpusGetPeminjaman(id).then(setP).catch((e) => setError(e.message))
  }

  useEffect(load, [id])

  async function perpanjang() {
    try {
      await api.perpusPerpanjangPeminjaman(id, tanggalBaru)
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  async function batalkan() {
    if (!confirm('Batalkan peminjaman ini?')) return
    try {
      await api.perpusBatalkanPeminjaman(id)
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!p) {
    return (
      <ModalShell title="Detail Peminjaman" onClose={onClose}>
        <Pesan error={error} />
        <Kosong>Memuat...</Kosong>
      </ModalShell>
    )
  }

  return (
    <ModalShell
      title={p.nomor_transaksi}
      onClose={onClose}
      footer={
        ['dipinjam', 'sebagian_kembali'].includes(p.status) && (
          <>
            <Btn bahaya onClick={batalkan}>Batalkan</Btn>
            <input type="date" value={tanggalBaru} onChange={(e) => setTanggalBaru(e.target.value)} className={`${inputClass} w-auto`} />
            <Btn utama disabled={!tanggalBaru} onClick={perpanjang}>Perpanjang</Btn>
          </>
        )
      }
    >
      <Pesan error={error} />
      <div className="text-sm mb-4">
        <p><span className="text-navy/50">Anggota:</span> {p.anggota?.nama} ({p.anggota?.nomor_kartu})</p>
        <p><span className="text-navy/50">Tanggal Pinjam:</span> {tgl(p.tanggal_pinjam)}</p>
        <p><span className="text-navy/50">Jatuh Tempo:</span> {tgl(p.tanggal_jatuh_tempo)}</p>
        <p><span className="text-navy/50">Petugas:</span> {p.petugas?.name ?? '-'}</p>
        <p><span className="text-navy/50">Status:</span> <Badge tone={TONE_STATUS_PEMINJAMAN[p.status]}>{p.status.replaceAll('_', ' ')}</Badge></p>
      </div>
      <div className="border border-navy/10 rounded-lg divide-y divide-navy/5">
        {p.item.map((it) => (
          <div key={it.id} className="px-3 py-2 text-sm flex items-center justify-between">
            <span className="text-navy">{it.eksemplar.buku.judul} <span className="text-xs text-navy/40">({it.eksemplar.kode_inventaris})</span></span>
            <Badge tone={it.status === 'dipinjam' ? 'biru' : it.status === 'hilang' ? 'merah' : 'hijau'}>{it.status}</Badge>
          </div>
        ))}
      </div>
    </ModalShell>
  )
}
