import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, ModalShell, Pagination, Pesan } from './PerpusUI'
import { inputClass, selectClass, tgl, TONE_STATUS_RESERVASI } from './perpusKonstanta'

export default function PerpusReservasiTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)

  function load() {
    const params = { page, per_page: 15 }
    if (status) params.status = status
    api.perpusListReservasi(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(load, [page, status])

  async function batalkan(id) {
    if (!confirm('Batalkan reservasi ini?')) return
    try {
      await api.perpusBatalkanReservasi(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function ambil(id) {
    setError('')
    setInfo('')
    try {
      const p = await api.perpusAmbilReservasi(id)
      setInfo(`Reservasi diambil sebagai peminjaman ${p.nomor_transaksi}.`)
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
          <h2 className="text-lg font-bold text-navy">Reservasi Buku</h2>
          <p className="text-xs text-navy/50 mt-0.5">Anggota dapat memesan buku terlebih dahulu sebelum eksemplar tersedia.</p>
        </div>
        <Btn utama onClick={() => setShowForm(true)}>+ Reservasi Baru</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="menunggu">Menunggu</option>
          <option value="siap_diambil">Siap Diambil</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
          <option value="kadaluarsa">Kadaluarsa</option>
        </select>
      </div>

      <Pesan error={error} info={info} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nomor Reservasi</th>
              <th className="px-4 py-3">Anggota</th>
              <th className="px-4 py-3">Buku</th>
              <th className="px-4 py-3">Batas Ambil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy/40">Belum ada reservasi.</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-navy/70">{r.nomor_reservasi}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{r.anggota?.nama}</td>
                  <td className="px-4 py-3 text-navy/70">{r.buku?.judul}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(r.batas_pengambilan)}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_RESERVASI[r.status]}>{r.status.replaceAll('_', ' ')}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {['menunggu', 'siap_diambil'].includes(r.status) && (
                      <>
                        <button onClick={() => ambil(r.id)} className="text-xs font-semibold text-navy-light hover:underline">Ambil</button>
                        <button onClick={() => batalkan(r.id)} className="text-xs font-semibold text-red-600 hover:underline">Batalkan</button>
                      </>
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
        <ReservasiFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function ReservasiFormModal({ onClose, onSaved }) {
  const [nomorKartu, setNomorKartu] = useState('')
  const [anggota, setAnggota] = useState(null)
  const [searchBuku, setSearchBuku] = useState('')
  const [daftarBuku, setDaftarBuku] = useState([])
  const [buku, setBuku] = useState(null)
  const [batasPengambilan, setBatasPengambilan] = useState('')
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

  useEffect(() => {
    if (!searchBuku.trim()) {
      setDaftarBuku([])
      return
    }
    const timer = setTimeout(() => {
      api.perpusListBuku({ search: searchBuku, status: 'aktif', per_page: 8 }).then((r) => setDaftarBuku(r.data)).catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [searchBuku])

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await api.perpusBuatReservasi({ anggota_id: anggota.id, buku_id: buku.id, batas_pengambilan: batasPengambilan || undefined })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title="Reservasi Buku Baru"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !anggota || !buku} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan Reservasi'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <Field label="Nomor Kartu Anggota" className="mb-3">
        <div className="flex gap-2">
          <input value={nomorKartu} onChange={(e) => setNomorKartu(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cariAnggota()} className={inputClass} />
          <Btn onClick={cariAnggota}>Cari</Btn>
        </div>
      </Field>
      {anggota && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">{anggota.nama} — {anggota.nomor_kartu}</p>}

      <Field label="Cari Buku" className="mb-2">
        <input value={searchBuku} onChange={(e) => setSearchBuku(e.target.value)} className={inputClass} placeholder="Ketik judul buku…" />
      </Field>
      {daftarBuku.length > 0 && (
        <div className="border border-navy/10 rounded-lg mb-3 max-h-40 overflow-y-auto">
          {daftarBuku.map((b) => (
            <label key={b.id} className="flex items-center gap-2 px-3 py-2 border-b border-navy/5 last:border-0 text-sm cursor-pointer hover:bg-navy/5">
              <input type="radio" name="buku" checked={buku?.id === b.id} onChange={() => setBuku(b)} />
              <span className="text-navy">{b.judul}</span>
              <span className="text-xs text-navy/40">({b.eksemplar_tersedia_count} tersedia)</span>
            </label>
          ))}
        </div>
      )}
      {buku && <p className="text-sm text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 mb-3">Dipilih: {buku.judul}</p>}

      <Field label="Batas Pengambilan" hint="Kosongkan untuk memakai default 3 hari.">
        <input type="date" value={batasPengambilan} onChange={(e) => setBatasPengambilan(e.target.value)} className={inputClass} />
      </Field>
    </ModalShell>
  )
}
