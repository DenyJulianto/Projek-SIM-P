import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Pilihan guru pengganti dengan penanda ketersediaan; guru yang bentrok tidak dapat dipilih. */
function PenggantiSelect({ value, onChange, ketersediaan }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
      <option value="">Pilih guru pengganti</option>
      {(ketersediaan ?? []).map((g) => (
        <option key={g.id} value={g.id} disabled={!g.tersedia}>
          {g.nama}
          {g.tersedia ? ` — tersedia${g.jumlah_pengganti_hari_ini ? ` (sudah ${g.jumlah_pengganti_hari_ini}× pengganti hari ini)` : ''}` : ` — tidak tersedia: ${g.alasan.join('; ')}`}
        </option>
      ))}
    </select>
  )
}

export default function GuruPenggantiFormModal({ item, opsi, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [tanggal, setTanggal] = useState(item?.tanggal ?? '')
  const [guruBerhalanganId, setGuruBerhalanganId] = useState(item?.guru_berhalangan?.id ? String(item.guru_berhalangan.id) : '')
  const [alasan, setAlasan] = useState(item?.alasan ?? '')
  const [catatan, setCatatan] = useState(item?.catatan ?? '')
  const [jadwal, setJadwal] = useState(null)
  const [peringatan, setPeringatan] = useState([])
  const [picks, setPicks] = useState({}) // jadwal_id -> { checked, pengganti }
  const [ketersediaan, setKetersediaan] = useState({}) // key -> daftar guru
  const [penggantiEdit, setPenggantiEdit] = useState(item?.guru_pengganti?.id ? String(item.guru_pengganti.id) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Edit: ketersediaan dimuat sekali untuk slot yang sama.
  function muatKetersediaanEdit() {
    api
      .getKetersediaanGuru({
        tanggal: item.tanggal,
        jam_mulai: item.jam_mulai,
        jam_selesai: item.jam_selesai,
        guru_berhalangan_id: item.guru_berhalangan.id,
        exclude_id: item.id,
      })
      .then((r) => setKetersediaan({ edit: r }))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    if (isEdit) muatKetersediaanEdit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cariJadwal(t, g) {
    setJadwal(null)
    setPicks({})
    setKetersediaan({})
    setPeringatan([])
    if (!t || !g) return
    api
      .getJadwalGuruPengganti({ guru_id: g, tanggal: t })
      .then((r) => {
        setJadwal(r.jadwal)
        setPeringatan(r.peringatan)
      })
      .catch((err) => setError(err.message))
  }

  function ubahTanggal(v) {
    setTanggal(v)
    cariJadwal(v, guruBerhalanganId)
  }

  function ubahGuru(v) {
    setGuruBerhalanganId(v)
    cariJadwal(tanggal, v)
  }

  function toggleSlot(j) {
    const checked = !picks[j.id]?.checked
    setPicks((p) => ({ ...p, [j.id]: { checked, pengganti: p[j.id]?.pengganti ?? '' } }))
    if (checked && !ketersediaan[j.id]) {
      api
        .getKetersediaanGuru({ tanggal, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, guru_berhalangan_id: guruBerhalanganId })
        .then((r) => setKetersediaan((k) => ({ ...k, [j.id]: r })))
        .catch((err) => setError(err.message))
    }
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let saved
      if (isEdit) {
        saved = await api.updateGuruPengganti(item.id, {
          guru_pengganti_id: Number(penggantiEdit),
          alasan,
          catatan: catatan || null,
        })
      } else {
        const items = Object.entries(picks)
          .filter(([, v]) => v.checked)
          .map(([id, v]) => ({ jadwal_id: Number(id), guru_pengganti_id: Number(v.pengganti) }))
        saved = await api.createGuruPengganti({
          tanggal,
          guru_berhalangan_id: Number(guruBerhalanganId),
          alasan,
          catatan: catatan || null,
          items,
        })
      }
      onSaved(saved.peringatan ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const dipilih = Object.values(picks).filter((p) => p.checked)
  const siapSimpan = isEdit ? Boolean(penggantiEdit) : dipilih.length > 0 && dipilih.every((p) => p.pengganti)

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-1">{isEdit ? 'Edit Guru Pengganti' : 'Tambah Guru Pengganti'}</h2>
        {isEdit && (
          <p className="text-xs text-navy/50 mb-4">
            {item.hari}, {item.tanggal} · {item.jam_mulai}–{item.jam_selesai} · {item.kelas?.nama_kelas} · {item.mata_pelajaran?.nama_mapel}. Tanggal dan jam tidak dapat diubah; batalkan lalu ajukan ulang bila perlu.
          </p>
        )}

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={submit} className="space-y-4 mt-3">
          {!isEdit && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Tanggal">
                <input type="date" required value={tanggal} onChange={(e) => ubahTanggal(e.target.value)} className="input" />
              </Field>
              <Field label="Guru yang Berhalangan">
                <select required value={guruBerhalanganId} onChange={(e) => ubahGuru(e.target.value)} className="input">
                  <option value="">Pilih guru</option>
                  {opsi.guru.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {!isEdit && tanggal && guruBerhalanganId && (
            <div>
              <p className="text-xs font-semibold text-navy/70 mb-2">Jam Pelajaran yang Perlu Diganti</p>
              {peringatan.map((w) => (
                <p key={w} className="text-xs text-amber-700 mb-2">
                  {w}
                </p>
              ))}
              {!jadwal ? (
                <p className="text-xs text-navy/40">Memuat jadwal...</p>
              ) : jadwal.length === 0 ? (
                <p className="text-xs text-navy/50">Guru ini tidak memiliki jadwal mengajar pada hari tersebut.</p>
              ) : (
                <div className="space-y-2">
                  {jadwal.map((j) => (
                    <div key={j.id} className={`border rounded-lg p-3 ${picks[j.id]?.checked ? 'border-navy/40' : 'border-navy/10'}`}>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" disabled={j.sudah_ada_pengganti} checked={Boolean(picks[j.id]?.checked)} onChange={() => toggleSlot(j)} />
                        <span className="font-medium text-navy">
                          {j.jam_mulai}–{j.jam_selesai}
                          {j.jam_ke ? ` (${j.jam_ke})` : ''} · {j.kelas} · {j.mata_pelajaran}
                        </span>
                        {j.sudah_ada_pengganti && <span className="text-[11px] text-amber-700">sudah ada pengganti</span>}
                      </label>
                      {picks[j.id]?.checked && (
                        <div className="mt-2">
                          {!ketersediaan[j.id] ? (
                            <p className="text-xs text-navy/40">Memeriksa ketersediaan guru...</p>
                          ) : (
                            <PenggantiSelect
                              value={picks[j.id].pengganti}
                              onChange={(v) => setPicks((p) => ({ ...p, [j.id]: { ...p[j.id], pengganti: v } }))}
                              ketersediaan={ketersediaan[j.id]}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isEdit && (
            <Field label="Guru Pengganti">
              {!ketersediaan.edit ? (
                <p className="text-xs text-navy/40">Memeriksa ketersediaan guru...</p>
              ) : (
                <PenggantiSelect value={penggantiEdit} onChange={setPenggantiEdit} ketersediaan={ketersediaan.edit} />
              )}
              {item.status === 'disetujui' && <p className="text-[11px] text-amber-700 mt-1">Mengganti guru pengganti akan mengembalikan status ke Menunggu Persetujuan.</p>}
            </Field>
          )}

          <Field label="Alasan">
            <input type="text" required maxLength={255} value={alasan} onChange={(e) => setAlasan(e.target.value)} className="input" placeholder="mis. Sakit, dinas luar, izin keluarga" />
          </Field>
          <Field label="Catatan">
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} className="input min-h-16" placeholder="mis. materi/tugas untuk siswa selama jam kosong" />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !siapSimpan}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Ajukan Penggantian'}
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
