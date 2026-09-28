import { useState } from 'react'
import { api } from '../lib/api'
import { Btn, Kosong, Pesan } from './PerpusUI'
import { inputClass, rupiah, selectClass } from './perpusKonstanta'

export default function PerpusPengembalianTab() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(null)
  const [pilihan, setPilihan] = useState({})
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [saving, setSaving] = useState(false)

  async function cari() {
    setError('')
    setInfo('')
    setItems(null)
    setPilihan({})
    try {
      const isBarcode = /^\d+$/.test(query.trim())
      const hasil = await api.perpusCariPengembalian(isBarcode ? { barcode: query.trim() } : { nomor_transaksi: query.trim() })
      setItems(hasil)
      const awal = {}
      hasil.forEach((h) => {
        awal[h.peminjaman_item_id] = { pilih: true, kondisi_kembali: 'baik', catatan_kerusakan: '', denda_kerusakan: '' }
      })
      setPilihan(awal)
    } catch (err) {
      setError(err.message)
    }
  }

  function ubah(id, key, value) {
    setPilihan((p) => ({ ...p, [id]: { ...p[id], [key]: value } }))
  }

  async function proses() {
    setSaving(true)
    setError('')
    try {
      const dipilih = Object.entries(pilihan).filter(([, v]) => v.pilih)
      await api.perpusProsesPengembalian(
        dipilih.map(([id, v]) => ({
          peminjaman_item_id: Number(id),
          kondisi_kembali: v.kondisi_kembali,
          catatan_kerusakan: v.catatan_kerusakan || undefined,
          denda_kerusakan: v.denda_kerusakan ? Number(v.denda_kerusakan) : undefined,
        }))
      )
      setInfo('Pengembalian berhasil diproses.')
      setItems(null)
      setQuery('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-navy">Pengembalian Buku</h2>
        <p className="text-xs text-navy/50 mt-0.5">Scan barcode buku atau masukkan nomor transaksi peminjaman untuk memproses pengembalian.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && cari()}
          placeholder="Barcode buku atau nomor transaksi…"
          className={`${inputClass} max-w-sm`}
        />
        <Btn utama onClick={cari} disabled={!query.trim()}>Cari</Btn>
      </div>

      <Pesan error={error} info={info} />

      {items && (
        items.length === 0 ? (
          <Kosong>Tidak ditemukan peminjaman aktif.</Kosong>
        ) : (
          <div className="space-y-3">
            {items.map((it) => {
              const p = pilihan[it.peminjaman_item_id] ?? {}
              return (
                <div key={it.peminjaman_item_id} className="bg-white border border-navy/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <label className="flex items-start gap-2">
                      <input type="checkbox" checked={!!p.pilih} onChange={(e) => ubah(it.peminjaman_item_id, 'pilih', e.target.checked)} className="mt-1" />
                      <div>
                        <p className="font-semibold text-navy">{it.buku.judul}</p>
                        <p className="text-xs text-navy/50">{it.eksemplar.kode_inventaris} · {it.anggota?.nama} ({it.anggota?.nomor_kartu})</p>
                        <p className="text-xs text-navy/50">Nomor transaksi: {it.peminjaman.nomor_transaksi}</p>
                      </div>
                    </label>
                    {it.hari_terlambat > 0 ? (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                        Terlambat {it.hari_terlambat} hari — denda {rupiah(it.estimasi_denda_keterlambatan)}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">Tepat waktu</span>
                    )}
                  </div>
                  {p.pilih && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div>
                        <span className="block text-[11px] font-semibold text-navy/60 mb-1">Kondisi Buku Saat Kembali</span>
                        <select value={p.kondisi_kembali} onChange={(e) => ubah(it.peminjaman_item_id, 'kondisi_kembali', e.target.value)} className={selectClass}>
                          <option value="baik">Baik</option>
                          <option value="rusak_ringan">Rusak Ringan</option>
                          <option value="rusak_berat">Rusak Berat</option>
                          <option value="hilang">Hilang</option>
                        </select>
                      </div>
                      {p.kondisi_kembali !== 'baik' && (
                        <>
                          <div>
                            <span className="block text-[11px] font-semibold text-navy/60 mb-1">Catatan Kerusakan</span>
                            <input value={p.catatan_kerusakan} onChange={(e) => ubah(it.peminjaman_item_id, 'catatan_kerusakan', e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <span className="block text-[11px] font-semibold text-navy/60 mb-1">Denda Kerusakan/Kehilangan (Rp)</span>
                            <input type="number" min="0" value={p.denda_kerusakan} onChange={(e) => ubah(it.peminjaman_item_id, 'denda_kerusakan', e.target.value)} className={inputClass} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            <Btn utama disabled={saving || !Object.values(pilihan).some((p) => p.pilih)} onClick={proses}>
              {saving ? 'Memproses...' : 'Konfirmasi Pengembalian'}
            </Btn>
          </div>
        )
      )}
    </div>
  )
}
