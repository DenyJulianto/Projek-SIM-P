import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function PerubahanJadwalFormModal({ item, opsi, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [jadwalList, setJadwalList] = useState(null)
  const [filterGuru, setFilterGuru] = useState('')
  const [filterKelas, setFilterKelas] = useState('')
  const [jadwalId, setJadwalId] = useState(item?.jadwal_id ? String(item.jadwal_id) : '')
  const [form, setForm] = useState({
    jenis: item?.jenis ?? 'sementara',
    tanggal_perubahan: item?.tanggal_perubahan ?? '',
    tanggal_baru: item?.tanggal_baru ?? '',
    hari_baru: item?.hari_baru ?? '',
    jam_mulai_baru: item?.jam_mulai_baru ?? '',
    jam_selesai_baru: item?.jam_selesai_baru ?? '',
    guru_baru_id: item?.guru_baru?.id ? String(item.guru_baru.id) : '',
    ruang_lama: item?.ruang_lama ?? '',
    ruang_baru: item?.ruang_baru ?? '',
    alasan: item?.alasan ?? '',
    catatan: item?.catatan ?? '',
  })
  const [bentrok, setBentrok] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Data jadwal lama: dari jadwal yang dipilih (tambah) atau snapshot pengajuan (edit).
  const jadwal = isEdit
    ? {
        id: item.jadwal_id,
        hari: item.hari_lama,
        jam_mulai: item.jam_mulai_lama,
        jam_selesai: item.jam_selesai_lama,
        kelas: item.kelas,
        mata_pelajaran: item.mata_pelajaran?.nama_mapel,
        guru: item.guru_lama,
      }
    : jadwalList?.find((j) => String(j.id) === jadwalId)

  function muatJadwal() {
    if (isEdit) return
    const params = {}
    if (filterGuru) params.guru_id = filterGuru
    if (filterKelas) params.kelas_id = filterKelas
    setJadwalList(null)
    api
      .listJadwalPerubahan(params)
      .then(setJadwalList)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    muatJadwal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGuru, filterKelas])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function pilihJadwal(id) {
    setJadwalId(id)
    const j = jadwalList?.find((x) => String(x.id) === id)
    if (j) {
      setForm((f) => ({
        ...f,
        jam_mulai_baru: j.jam_mulai,
        jam_selesai_baru: j.jam_selesai,
        hari_baru: j.hari,
        guru_baru_id: String(j.guru.id),
        ruang_lama: j.ruang ?? '',
        ruang_baru: j.ruang ?? '',
      }))
    }
  }

  function payload() {
    return {
      jadwal_id: Number(jadwalId),
      jenis: form.jenis,
      tanggal_perubahan: form.tanggal_perubahan,
      tanggal_baru: form.jenis === 'sementara' ? form.tanggal_baru || form.tanggal_perubahan : null,
      hari_baru: form.jenis === 'permanen' ? form.hari_baru : null,
      jam_mulai_baru: form.jam_mulai_baru,
      jam_selesai_baru: form.jam_selesai_baru,
      guru_baru_id: form.guru_baru_id ? Number(form.guru_baru_id) : null,
      ruang_lama: form.ruang_lama || null,
      ruang_baru: form.ruang_baru || null,
      alasan: form.alasan,
      catatan: form.catatan || null,
    }
  }

  const lengkap =
    jadwalId && form.tanggal_perubahan && form.jam_mulai_baru && form.jam_selesai_baru && form.jam_selesai_baru > form.jam_mulai_baru && (form.jenis === 'sementara' || form.hari_baru)

  // Cek bentrok otomatis (guru, kelas, ruang) setiap kali isian relevan berubah.
  function cekBentrok() {
    if (!lengkap) {
      setBentrok(null)
      return
    }
    const p = payload()
    const params = Object.fromEntries(Object.entries(p).filter(([k, v]) => v !== null && v !== '' && k !== 'alasan' && k !== 'catatan'))
    if (isEdit) params.exclude_id = item.id
    api
      .cekBentrokPerubahanJadwal(params)
      .then(setBentrok)
      .catch((err) => setBentrok({ galat: err.message }))
  }

  useEffect(() => {
    const timer = setTimeout(cekBentrok, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jadwalId, form.jenis, form.tanggal_perubahan, form.tanggal_baru, form.hari_baru, form.jam_mulai_baru, form.jam_selesai_baru, form.guru_baru_id, form.ruang_baru])

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = isEdit ? await api.updatePerubahanJadwal(item.id, payload()) : await api.createPerubahanJadwal(payload())
      onSaved(saved.peringatan ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Perubahan Jadwal' : 'Tambah Perubahan Jadwal'}</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-navy/70">Jadwal yang Diubah</p>
              <div className="grid grid-cols-2 gap-2">
                <select value={filterGuru} onChange={(e) => setFilterGuru(e.target.value)} className="input">
                  <option value="">Semua guru</option>
                  {opsi.guru.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama}
                    </option>
                  ))}
                </select>
                <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="input">
                  <option value="">Semua rombel</option>
                  {opsi.kelas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
              <select required value={jadwalId} onChange={(e) => pilihJadwal(e.target.value)} className="input">
                <option value="">{jadwalList ? 'Pilih jadwal' : 'Memuat jadwal...'}</option>
                {(jadwalList ?? []).map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.hari} {j.jam_mulai}–{j.jam_selesai} · {j.kelas.nama_kelas} · {j.mata_pelajaran} · {j.guru.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {jadwal && (
            <div className="bg-navy/5 rounded-xl p-3 text-xs text-navy/70">
              <p className="font-semibold text-navy mb-0.5">Jadwal Lama</p>
              {jadwal.hari}, {jadwal.jam_mulai}–{jadwal.jam_selesai} · {jadwal.kelas?.nama_kelas} · {jadwal.mata_pelajaran} · {jadwal.guru?.nama}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Jenis Perubahan">
              <select value={form.jenis} onChange={(e) => update('jenis', e.target.value)} className="input">
                <option value="sementara">Sementara (satu tanggal)</option>
                <option value="permanen">Permanen (berlaku mulai tanggal)</option>
              </select>
            </Field>
            <Field label={form.jenis === 'sementara' ? 'Tanggal Perubahan (jadwal lama)' : 'Berlaku Mulai Tanggal'}>
              <input type="date" required value={form.tanggal_perubahan} onChange={(e) => update('tanggal_perubahan', e.target.value)} className="input" />
            </Field>
            {form.jenis === 'sementara' ? (
              <Field label="Dipindah ke Tanggal (kosong = sama)">
                <input type="date" value={form.tanggal_baru} onChange={(e) => update('tanggal_baru', e.target.value)} className="input" />
              </Field>
            ) : (
              <Field label="Hari Baru">
                <select required value={form.hari_baru} onChange={(e) => update('hari_baru', e.target.value)} className="input">
                  <option value="">Pilih hari</option>
                  {HARI.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Guru">
              <select value={form.guru_baru_id} onChange={(e) => update('guru_baru_id', e.target.value)} className="input">
                <option value="">Tetap</option>
                {opsi.guru.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jam Baru — Mulai">
              <input type="time" required value={form.jam_mulai_baru} onChange={(e) => update('jam_mulai_baru', e.target.value)} className="input" />
            </Field>
            <Field label="Jam Baru — Selesai">
              <input type="time" required value={form.jam_selesai_baru} onChange={(e) => update('jam_selesai_baru', e.target.value)} className="input" />
            </Field>
            <Field label="Ruang Lama">
              <input type="text" maxLength={100} value={form.ruang_lama} onChange={(e) => update('ruang_lama', e.target.value)} className="input" placeholder="Ruang kelas rombel" />
            </Field>
            <Field label="Ruang Baru">
              <input type="text" maxLength={100} value={form.ruang_baru} onChange={(e) => update('ruang_baru', e.target.value)} className="input" placeholder="mis. Lab IPA" />
            </Field>
          </div>

          {bentrok && (
            <div className={`rounded-xl p-3 text-xs ${bentrok.galat ? 'bg-amber-50 text-amber-800' : bentrok.bentrok ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {bentrok.galat ? (
                bentrok.galat
              ) : bentrok.bentrok ? (
                <>
                  <p className="font-semibold mb-1">Terdapat bentrok:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {bentrok.konflik.map((k) => (
                      <li key={`${k.jenis}-${k.pesan}`}>
                        <b>{k.jenis}</b> — {k.pesan}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                'Tidak ada bentrok guru, kelas, maupun ruang.'
              )}
            </div>
          )}

          <Field label="Alasan Perubahan">
            <input type="text" required maxLength={255} value={form.alasan} onChange={(e) => update('alasan', e.target.value)} className="input" />
          </Field>
          <Field label="Catatan">
            <textarea value={form.catatan} onChange={(e) => update('catatan', e.target.value)} className="input min-h-16" />
          </Field>

          {isEdit && item.status !== 'menunggu_persetujuan' && <p className="text-[11px] text-amber-700">Menyimpan perubahan akan mengembalikan status ke Menunggu Persetujuan.</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !lengkap || Boolean(bentrok?.bentrok)}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Ajukan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}
