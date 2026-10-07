import { useEffect, useState } from 'react'
import ConfirmActionModal from '../components/ConfirmActionModal'
import ModalCloseButton from '../components/ModalCloseButton'
import { DaftarRiwayatPoin, PedomanPoin, RingkasanPoin } from '../components/RiwayatPoin'
import { api } from '../lib/api'
import { nadaPoin, statusPotongPoin } from '../lib/poinKedisiplinan'

/**
 * Menu Kesiswaan "Poin Siswa": daftar sisa poin kedisiplinan semua siswa
 * (setiap siswa mulai 100) dan CRUD buku poin per siswa — pengurangan karena
 * pelanggaran & penambahan karena apresiasi, dengan rentang poin per
 * kategori dari server. Siswa & orang tua melihat buku poin yang sama
 * (baca-saja) di menu Poin mereka.
 */
export default function PoinSiswaManagement({ onBack }) {
  const [dipilih, setDipilih] = useState(null)

  if (dipilih) return <DetailPoinSiswa siswaId={dipilih} onBack={() => setDipilih(null)} />
  return <DaftarPoinSiswa onBack={onBack} onPilih={setDipilih} />
}

function DaftarPoinSiswa({ onBack, onPilih }) {
  const [hasil, setHasil] = useState(null)
  const [kelas, setKelas] = useState([])
  const [filter, setFilter] = useState({ search: '', kelas_id: '', urut: 'nama' })
  const [cari, setCari] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listKelas({ per_page: 200 }).then((r) => setKelas(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const params = { page, per_page: 20, urut: filter.urut }
    if (filter.search) params.search = filter.search
    if (filter.kelas_id) params.kelas_id = filter.kelas_id
    api
      .listPoinSiswa(params)
      .then((r) => {
        setHasil(r)
        setError('')
      })
      .catch((err) => setError(err.message))
  }, [filter, page])

  const ubahFilter = (k, v) => {
    setPage(1)
    setFilter((f) => ({ ...f, [k]: v }))
  }

  return (
    <div>
      <div className="mb-5">
        {onBack && (
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
            ← Kembali ke Dashboard
          </button>
        )}
        <h1 className="text-xl font-extrabold text-navy">Poin Siswa</h1>
        <p className="text-sm text-navy/45 mt-0.5">
          Setiap siswa mulai dengan {hasil?.poin_awal ?? 100} poin kedisiplinan: berkurang karena pelanggaran dan bertambah kembali
          karena prestasi atau perilaku terpuji. Pilih siswa untuk mengelola buku poinnya.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ubahFilter('search', cari.trim())
        }}
        className="flex flex-wrap items-center gap-2 mb-5"
      >
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari nama / NIS / NISN..."
          className="flex-1 min-w-52 border border-navy/10 rounded-full px-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
        />
        <select
          value={filter.kelas_id}
          onChange={(e) => ubahFilter('kelas_id', e.target.value)}
          className="border border-navy/10 rounded-full px-4 py-2 text-sm text-navy bg-white"
          aria-label="Filter kelas"
        >
          <option value="">Semua kelas</option>
          {kelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama_kelas}
            </option>
          ))}
        </select>
        <select
          value={filter.urut}
          onChange={(e) => ubahFilter('urut', e.target.value)}
          className="border border-navy/10 rounded-full px-4 py-2 text-sm text-navy bg-white"
          aria-label="Urutkan"
        >
          <option value="nama">Urut nama</option>
          <option value="poin">Poin terendah dulu</option>
        </select>
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full">
          Cari
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-5 py-3">Siswa</th>
              <th className="px-5 py-3">Kelas</th>
              <th className="px-5 py-3 text-center">Catatan</th>
              <th className="px-5 py-3 w-64">Sisa Poin</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {!hasil ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : hasil.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-navy/40">
                  Tidak ada siswa yang cocok.
                </td>
              </tr>
            ) : (
              hasil.data.map((s) => {
                const nada = nadaPoin(s.poin_disiplin, hasil.poin_awal)
                return (
                  <tr key={s.id} className="border-t border-navy/5 hover:bg-emerald-50/40">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-navy">{s.nama}</p>
                      <p className="text-xs text-navy/45">NIS {s.nis || '-'}</p>
                    </td>
                    <td className="px-5 py-3 text-navy/70">{s.kelas?.nama_kelas || '-'}</td>
                    <td className="px-5 py-3 text-center text-navy/70">{s.catatan_poin_count}×</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 text-right font-extrabold ${nada.teks}`}>{s.poin_disiplin}</span>
                        <div className="flex-1 h-2 rounded-full bg-navy/5 overflow-hidden">
                          <div className={`h-full rounded-full ${nada.bar}`} style={{ width: `${(s.poin_disiplin / hasil.poin_awal) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onPilih(s.id)}
                        className="text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-full"
                      >
                        Kelola Poin
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {hasil && hasil.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-navy/60">
          <span>
            Halaman {hasil.current_page} dari {hasil.last_page} · {hasil.total} siswa
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-full border border-navy/10 disabled:opacity-40">
              ← Sebelumnya
            </button>
            <button
              disabled={page >= hasil.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-full border border-navy/10 disabled:opacity-40"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailPoinSiswa({ siswaId, onBack }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null) // null | { arah } (baru) | item riwayat
  const [hapus, setHapus] = useState(null)
  const [sibuk, setSibuk] = useState(false)

  useEffect(() => {
    api
      .getPoinSiswa(siswaId)
      .then((d) => {
        setData(d)
        setError('')
      })
      .catch((err) => setError(err.message))
  }, [siswaId])

  async function konfirmasiHapus() {
    setSibuk(true)
    try {
      const ringkasan = await api.deleteCatatanPoin(hapus.id)
      setData((d) => ({ ...d, ...ringkasan }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSibuk(false)
      setHapus(null)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
            ← Kembali ke Poin Siswa
          </button>
          <h1 className="text-xl font-extrabold text-navy">{data?.siswa.nama ?? 'Memuat...'}</h1>
          {data && (
            <p className="text-sm text-navy/45 mt-0.5">
              {data.siswa.kelas || 'Tanpa kelas'} · NIS {data.siswa.nis || '-'}
            </p>
          )}
        </div>
        {data && (
          <div className="flex gap-2">
            <button
              onClick={() => setForm({ arah: -1 })}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              − Kurangi Poin
            </button>
            <button
              onClick={() => setForm({ arah: 1 })}
              disabled={data.sisa_poin >= data.poin_awal}
              title={data.sisa_poin >= data.poin_awal ? `Poin sudah penuh (${data.poin_awal}).` : undefined}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
            >
              + Tambah Poin
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {data && (
        <div className="space-y-5">
          <RingkasanPoin data={data} />
          <div>
            <h2 className="text-sm font-bold text-navy mb-3">Riwayat Buku Poin</h2>
            <DaftarRiwayatPoin
              data={data}
              kosong="Belum ada catatan poin untuk siswa ini."
              aksi={(r) =>
                r.kategori === 'penyesuaian' ? null : (
                  <>
                    <button
                      onClick={() => setForm(r)}
                      className="text-[11px] font-semibold text-navy border border-navy/15 hover:bg-navy/5 px-2.5 py-1 rounded-full"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => setHapus(r)}
                      className="text-[11px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-full"
                    >
                      Hapus
                    </button>
                  </>
                )
              }
            />
          </div>
          <PedomanPoin kategori={data.kategori} />
        </div>
      )}

      {form && data && (
        <FormCatatanPoin
          item={form}
          siswaId={siswaId}
          data={data}
          onClose={() => setForm(null)}
          onTersimpan={(d) => {
            setForm(null)
            setData((lama) => ({ ...lama, ...d }))
          }}
        />
      )}

      {hapus && (
        <ConfirmActionModal
          title="Hapus catatan poin ini?"
          message={`"${hapus.keterangan}" (${hapus.perubahan > 0 ? '+' : '−'}${hapus.poin} poin) akan dihapus dan sisa poin dihitung ulang.`}
          confirmLabel="Ya, Hapus"
          tone="danger"
          loading={sibuk}
          onConfirm={konfirmasiHapus}
          onClose={() => setHapus(null)}
        />
      )}
    </div>
  )
}

const TINGKAT_KE_KATEGORI = { ringan: 'ringan', sedang: 'sedang', berat: 'berat', sangat_berat: 'sangat_berat' }

function FormCatatanPoin({ item, siswaId, data, onClose, onTersimpan }) {
  const baru = !item.id
  const kategoriSemua = data.kategori
  const arah = baru ? item.arah : (kategoriSemua[item.kategori]?.arah ?? -1)
  const pilihan = Object.entries(kategoriSemua).filter(([, k]) => k.arah === arah)
  const dariBk = !!item.dari_pengajuan_bk

  const [f, setF] = useState(() => {
    const kategori = item.kategori ?? pilihan[0][0]
    return {
      kategori,
      poin: item.poin ?? kategoriSemua[kategori].min,
      keterangan: item.keterangan ?? '',
      tanggal: item.tanggal ?? new Date().toISOString().slice(0, 10),
      pelanggaran_id: item.pelanggaran_id ?? '',
      prestasi_id: item.prestasi_id ?? '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const info = kategoriSemua[f.kategori]
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  // Ganti kategori → poin disesuaikan ke rentang kategori baru.
  function pilihKategori(e) {
    const k = kategoriSemua[e.target.value]
    setF((p) => ({
      ...p,
      kategori: e.target.value,
      poin: Math.min(k.max, Math.max(k.min, Number(p.poin) || k.min)),
      prestasi_id: e.target.value === 'prestasi' ? p.prestasi_id : '',
    }))
  }

  // Memilih pelanggaran mengisi kategori (dari tingkatnya), poin & tanggal.
  function pilihPelanggaran(e) {
    const id = e.target.value
    const p = data.pelanggaran.find((x) => String(x.id) === id)
    setF((lama) => {
      const kategori = (p && TINGKAT_KE_KATEGORI[p.tingkat]) || lama.kategori
      const k = kategoriSemua[kategori]
      const poinUsul = p?.poin && p.poin >= k.min && p.poin <= k.max ? p.poin : null
      return {
        ...lama,
        pelanggaran_id: id,
        kategori,
        poin: poinUsul ?? Math.min(k.max, Math.max(k.min, Number(lama.poin) || k.min)),
        tanggal: p?.tanggal ? String(p.tanggal).slice(0, 10) : lama.tanggal,
      }
    })
  }

  function pilihPrestasi(e) {
    const id = e.target.value
    const p = data.prestasi.find((x) => String(x.id) === id)
    setF((lama) => ({ ...lama, prestasi_id: id, tanggal: p?.tanggal ? String(p.tanggal).slice(0, 10) : lama.tanggal }))
  }

  // Perkiraan sisa poin bila catatan baru ini ditambahkan hari ini (0–poin awal).
  const awal = data.poin_awal
  const perubahan = arah * (Number(f.poin) || 0)
  const sisaSekarang = baru ? data.sisa_poin : null
  const perkiraan = sisaSekarang === null ? null : Math.min(awal, Math.max(0, sisaSekarang + perubahan))

  async function simpan(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...f,
      poin: Number(f.poin),
      pelanggaran_id: arah < 0 ? f.pelanggaran_id || null : null,
      prestasi_id: f.kategori === 'prestasi' ? f.prestasi_id || null : null,
    }
    try {
      onTersimpan(baru ? await api.tambahCatatanPoin(siswaId, payload) : await api.updateCatatanPoin(item.id, payload))
    } catch (err) {
      setError(err.errors ? Object.values(err.errors).flat().join(' ') : err.message)
    } finally {
      setSaving(false)
    }
  }

  const terkait = arah < 0 ? data.pelanggaran : f.kategori === 'prestasi' ? data.prestasi : null

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 p-6 max-h-[92vh] overflow-y-auto">
        <ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">
          {baru ? (arah < 0 ? 'Kurangi Poin Siswa' : 'Tambah Poin Siswa') : 'Ubah Catatan Poin'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={simpan} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">Kategori *</span>
            <select value={f.kategori} onChange={pilihKategori} className="input">
              {pilihan.map(([key, k]) => (
                <option key={key} value={key}>
                  {k.label} ({k.arah > 0 ? '+' : '−'}
                  {k.min === k.max ? k.min : `${k.min}–${k.max}`})
                </option>
              ))}
            </select>
            <span className="block text-[11px] text-navy/50 mt-1">Contoh: {info.contoh}</span>
          </label>

          {terkait && (
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">
                {arah < 0 ? 'Pelanggaran terkait' : 'Data prestasi terkait'}
              </span>
              <select
                value={arah < 0 ? f.pelanggaran_id : f.prestasi_id}
                onChange={arah < 0 ? pilihPelanggaran : pilihPrestasi}
                className="input"
              >
                <option value="">— Tidak dikaitkan —</option>
                {terkait.map((x) => {
                  // Pelanggaran yang sudah memotong poin (kecuali milik catatan ini) tidak bisa dipilih lagi.
                  const terkunci = arah < 0 && String(x.id) !== String(item.pelanggaran_id ?? '') && statusPotongPoin(x)
                  return (
                    <option key={x.id} value={x.id} disabled={!!terkunci}>
                      {String(x.tanggal).slice(0, 10)} · {x.jenis ?? x.judul} ({x.tingkat?.replace('_', ' ')}){terkunci ? ` — ${terkunci}` : ''}
                    </option>
                  )
                })}
              </select>
            </label>
          )}

          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">
              Keterangan {f.pelanggaran_id || f.prestasi_id ? '(opsional)' : '*'}
            </span>
            <input
              value={f.keterangan}
              onChange={set('keterangan')}
              required={!f.pelanggaran_id && !f.prestasi_id}
              maxLength={255}
              placeholder={f.pelanggaran_id || f.prestasi_id ? 'Otomatis dari data terkait' : arah < 0 ? 'mis. Terlambat masuk kelas' : 'mis. Mengembalikan dompet temuan'}
              className="input"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">
                Poin {arah < 0 ? 'dikurangi' : 'ditambah'} *{' '}
                <span className="font-normal text-navy/45">
                  ({info.min === info.max ? info.min : `${info.min}–${info.max}`})
                </span>
              </span>
              <input
                type="number"
                required
                min={dariBk ? 1 : info.min}
                max={dariBk ? 1000 : info.max}
                value={f.poin}
                onChange={set('poin')}
                readOnly={info.min === info.max && !dariBk}
                className="input"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">Tanggal *</span>
              <input type="date" required max={new Date().toISOString().slice(0, 10)} value={f.tanggal} onChange={set('tanggal')} className="input" />
            </label>
          </div>

          {f.kategori === 'sangat_berat' && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              Pelanggaran sangat berat menghabiskan seluruh poin. Sesuai tata tertib, umumnya siswa dikembalikan kepada orang tua —
              keputusan akhir tetap ada pada sekolah.
            </p>
          )}
          {perkiraan !== null && (
            <p className="text-xs text-navy/55 bg-white/70 border border-emerald-100 rounded-xl px-3 py-2">
              Perkiraan sisa poin setelah disimpan: <span className={`font-bold ${nadaPoin(perkiraan, awal).teks}`}>{perkiraan}</span>
              {arah > 0 && sisaSekarang + perubahan > awal && <> (maksimal {awal})</>}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              Batal
            </button>
            <button type="submit" disabled={saving} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
