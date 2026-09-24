import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { KATEGORI_LABEL, KATEGORI_STYLE, STATUS_KEGIATAN } from './kalenderKonstanta'

const primaryBtn = 'bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50'
const PENGINGAT = [
  ['', 'Tanpa pengingat'],
  ['0', 'Pada hari-H'],
  ['1', '1 hari sebelumnya'],
  ['3', '3 hari sebelumnya'],
  ['7', '7 hari sebelumnya'],
  ['14', '14 hari sebelumnya'],
]
const fmtUkuran = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}

/** Tambah / edit agenda; setelah tersimpan bisa langsung menambah lampiran. */
export function KegiatanFormModal({ item, tahunAjaranId, tanggalAwal, guru, onClose, onSaved }) {
  const [tersimpan, setTersimpan] = useState(item ? { id: item.id } : null)
  const isEdit = Boolean(tersimpan)
  const [form, setForm] = useState({
    judul: item?.judul ?? '',
    kategori: item?.kategori ?? 'kegiatan_sekolah',
    tanggal_mulai: item?.tanggal_mulai ?? tanggalAwal ?? '',
    tanggal_selesai: item?.tanggal_selesai ?? '',
    waktu_mulai: item?.waktu_mulai ?? '',
    waktu_selesai: item?.waktu_selesai ?? '',
    penanggung_jawab_guru_id: item?.penanggung_jawab_guru_id ? String(item.penanggung_jawab_guru_id) : '',
    penanggung_jawab: item?.penanggung_jawab_teks ?? '',
    lokasi: item?.lokasi ?? '',
    peserta: item?.peserta ?? '',
    keterangan: item?.keterangan ?? '',
    status: item?.status ?? 'direncanakan',
    pengingat_hari: item?.pengingat_hari != null ? String(item.pengingat_hari) : '',
  })
  const [lampiran, setLampiran] = useState([])
  const [peringatan, setPeringatan] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [berkas, setBerkas] = useState(false)

  function muatLampiran(id) {
    api
      .getKegiatanKalender(id)
      .then((d) => setLampiran(d.lampiran))
      .catch(() => {})
  }

  useEffect(() => {
    if (item?.id) muatLampiran(item.id)
  }, [item])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        tanggal_selesai: form.tanggal_selesai || null,
        waktu_mulai: form.waktu_mulai || null,
        waktu_selesai: form.waktu_selesai || null,
        penanggung_jawab_guru_id: form.penanggung_jawab_guru_id ? Number(form.penanggung_jawab_guru_id) : null,
        penanggung_jawab: form.penanggung_jawab_guru_id ? null : form.penanggung_jawab || null,
        lokasi: form.lokasi || null,
        peserta: form.peserta || null,
        keterangan: form.keterangan || null,
        pengingat_hari: form.pengingat_hari === '' ? null : Number(form.pengingat_hari),
      }
      const res = tersimpan ? await api.updateKegiatanKalender(tersimpan.id, payload) : await api.createKegiatanKalender({ ...payload, tahun_ajaran_id: tahunAjaranId })
      setPeringatan(res.peringatan ?? [])
      onSaved()
      if (!tersimpan) {
        setTersimpan({ id: res.id })
      } else if ((res.peringatan ?? []).length === 0) {
        onClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function unggah(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !tersimpan) return
    setBerkas(true)
    setError('')
    try {
      await api.unggahLampiranKalender(tersimpan.id, file)
      muatLampiran(tersimpan.id)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBerkas(false)
    }
  }

  async function hapusLampiran(l) {
    if (!window.confirm(`Hapus lampiran "${l.nama_asli}"?`)) return
    try {
      await api.hapusLampiranKalender(l.id)
      muatLampiran(tersimpan.id)
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  const dampakHariEfektif = ['libur', 'ujian', 'kegiatan_sekolah'].includes(form.kategori)

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-2xl w-full shadow-2xl shadow-teal-900/20 max-h-[92vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-3">{item ? 'Edit Agenda' : tersimpan ? 'Agenda Tersimpan' : 'Tambah Agenda'}</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {peringatan.map((w) => (
          <p key={w} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 mb-2">
            {w}
          </p>
        ))}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nama Kegiatan" className="sm:col-span-2">
              <input type="text" required maxLength={255} value={form.judul} onChange={(e) => update('judul', e.target.value)} className="input" />
            </Field>
            <Field label="Jenis Kegiatan">
              <select value={form.kategori} onChange={(e) => update('kategori', e.target.value)} className="input">
                {Object.entries(KATEGORI_LABEL)
                  .filter(([k]) => k !== 'periode')
                  .map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Status Kegiatan">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
                {Object.entries(STATUS_KEGIATAN).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            {dampakHariEfektif && (
              <p className="sm:col-span-2 text-[11px] text-navy/60 bg-navy/5 rounded-lg p-2">
                Hari libur/ujian yang meniadakan pembelajaran dikelola di menu <b>Hari Efektif</b> dan tampil otomatis di kalender ini. Agenda kategori ini hanya penanda tambahan dan
                <b> tidak mengubah</b> rekap hari efektif.
              </p>
            )}
            <Field label="Tanggal Mulai">
              <input type="date" required value={form.tanggal_mulai} onChange={(e) => update('tanggal_mulai', e.target.value)} className="input" />
            </Field>
            <Field label="Tanggal Selesai (kosong = 1 hari)">
              <input type="date" min={form.tanggal_mulai} value={form.tanggal_selesai} onChange={(e) => update('tanggal_selesai', e.target.value)} className="input" />
            </Field>
            <Field label="Waktu Mulai">
              <input type="time" value={form.waktu_mulai} onChange={(e) => update('waktu_mulai', e.target.value)} className="input" />
            </Field>
            <Field label="Waktu Selesai">
              <input type="time" value={form.waktu_selesai} onChange={(e) => update('waktu_selesai', e.target.value)} className="input" />
            </Field>
            <Field label="Penanggung Jawab (guru)">
              <select value={form.penanggung_jawab_guru_id} onChange={(e) => update('penanggung_jawab_guru_id', e.target.value)} className="input">
                <option value="">— pilih guru / ketik nama lain —</option>
                {guru.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Atau nama/pihak lain">
              <input type="text" maxLength={255} disabled={Boolean(form.penanggung_jawab_guru_id)} value={form.penanggung_jawab} onChange={(e) => update('penanggung_jawab', e.target.value)} className="input" placeholder="mis. Panitia PPDB" />
            </Field>
            <Field label="Lokasi">
              <input type="text" maxLength={255} value={form.lokasi} onChange={(e) => update('lokasi', e.target.value)} className="input" />
            </Field>
            <Field label="Pengingat">
              <select value={form.pengingat_hari} onChange={(e) => update('pengingat_hari', e.target.value)} className="input">
                {PENGINGAT.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Peserta" className="sm:col-span-2">
              <input type="text" maxLength={2000} value={form.peserta} onChange={(e) => update('peserta', e.target.value)} className="input" placeholder="mis. Seluruh siswa kelas X, guru dan tenaga kependidikan" />
            </Field>
            <Field label="Keterangan" className="sm:col-span-2">
              <textarea maxLength={5000} value={form.keterangan} onChange={(e) => update('keterangan', e.target.value)} className="input min-h-20" />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              {isEdit ? 'Selesai' : 'Batal'}
            </button>
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Agenda'}
            </button>
          </div>
        </form>

        {isEdit && (
          <div className="mt-5 border-t border-navy/10 pt-4">
            <p className="text-sm font-bold text-navy mb-2">Lampiran</p>
            {lampiran.length === 0 && <p className="text-xs text-navy/40 mb-2">Belum ada lampiran.</p>}
            <ul className="space-y-1 mb-2">
              {lampiran.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-xs border border-navy/10 rounded-lg px-3 py-1.5">
                  <button type="button" onClick={() => api.unduhLampiranKalender(l.id, l.nama_asli).catch((err) => setError(err.message))} className="text-navy font-medium underline truncate text-left">
                    {l.nama_asli} <span className="text-navy/40 no-underline">({fmtUkuran(l.ukuran)})</span>
                  </button>
                  <button type="button" onClick={() => hapusLampiran(l)} className="text-red-600 font-semibold">
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
            <input type="file" disabled={berkas} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png" onChange={unggah} className="block text-xs" />
            <p className="text-[11px] text-navy/40 mt-1">PDF, Word, Excel, PowerPoint, atau gambar. Maks. 5 MB per file, 10 file per agenda.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const FIELD_LABEL = {
  judul: 'Nama Kegiatan',
  kategori: 'Jenis',
  tanggal_mulai: 'Tanggal Mulai',
  tanggal_selesai: 'Tanggal Selesai',
  waktu: 'Waktu',
  penanggung_jawab: 'Penanggung Jawab',
  lokasi: 'Lokasi',
  peserta: 'Peserta',
  keterangan: 'Keterangan',
  status: 'Status',
  pengingat_hari: 'Pengingat (hari)',
}
const EVENT_LABEL = { created: 'Dibuat', updated: 'Diperbarui', deleted: 'Dihapus', lampiran: 'Lampiran' }
const fmt = (v) => (v === null || v === undefined || v === '' ? '-' : String(v))

/** Detail agenda (atau info baca-saja untuk entri dari Hari Efektif / periode). */
export function KegiatanDetailModal({ entri, onClose, onEdit, onHapus, onNavigate }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!entri.id) return
    api
      .getKegiatanKalender(entri.id)
      .then(setDetail)
      .catch((err) => setError(err.message))
  }, [entri.id])

  const s = KATEGORI_STYLE[entri.kategori] ?? KATEGORI_STYLE.lainnya
  const d = detail ?? entri

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-xl w-full shadow-2xl shadow-teal-900/20 max-h-[88vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
<ModalCloseButton onClose={onClose} />
        <div className="flex justify-between items-start gap-3 mb-2">
          <div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.chip}`}>{entri.kategori_label}</span>
            <h2 className="text-lg font-extrabold text-navy mt-1.5">{entri.judul}</h2>
          </div>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-sm mb-4">
          <Baris label="Tanggal" value={entri.tanggal_selesai !== entri.tanggal_mulai ? `${entri.tanggal_mulai} s.d. ${entri.tanggal_selesai}` : entri.tanggal_mulai} />
          {entri.waktu_mulai && <Baris label="Waktu" value={`${entri.waktu_mulai}${entri.waktu_selesai ? ` – ${entri.waktu_selesai}` : ''}`} />}
          <Baris label="Sumber" value={entri.sumber_label} />
          {!entri.baca_saja && (
            <>
              <Baris label="Status" value={d.status_label} />
              <Baris label="Penanggung jawab" value={d.penanggung_jawab} />
              <Baris label="Lokasi" value={d.lokasi} />
              <Baris label="Peserta" value={d.peserta} />
              <Baris label="Keterangan" value={d.keterangan} />
              <Baris label="Pengingat" value={d.pengingat_hari == null ? 'Tanpa pengingat' : d.pengingat_hari === 0 ? 'Pada hari-H' : `${d.pengingat_hari} hari sebelumnya`} />
              {d.disalin && <Baris label="Catatan" value="Disalin dari kalender tahun sebelumnya — periksa kembali tanggalnya." />}
            </>
          )}
        </dl>

        {entri.baca_saja ? (
          <div className="bg-navy/5 rounded-xl p-3 text-xs text-navy/70">
            {entri.sumber === 'hari_efektif' ? (
              <>
                Entri ini berasal dari modul <b>Hari Efektif</b> dan tidak diubah di kalender.{' '}
                <button onClick={() => onNavigate('hari-efektif')} className="font-semibold text-navy underline">
                  Buka Hari Efektif
                </button>
              </>
            ) : (
              'Penanda periode dihitung dari data Tahun Ajaran dan Semester.'
            )}
          </div>
        ) : (
          <>
            {detail?.lampiran?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-navy mb-1">Lampiran</p>
                <ul className="space-y-1">
                  {detail.lampiran.map((l) => (
                    <li key={l.id} className="text-xs">
                      <button onClick={() => api.unduhLampiranKalender(l.id, l.nama_asli).catch((err) => setError(err.message))} className="text-navy underline">
                        {l.nama_asli} ({fmtUkuran(l.ukuran)})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail && (
              <div className="mb-4">
                <p className="text-sm font-bold text-navy mb-1">Riwayat Perubahan</p>
                <div className="space-y-1.5">
                  {detail.riwayat.map((r) => {
                    const { old: lama, new: baru } = r.properties ?? {}
                    const fields = lama && baru ? Object.keys(FIELD_LABEL).filter((f) => f in baru && fmt(lama[f]) !== fmt(baru[f])) : []
                    return (
                      <div key={r.id} className="border border-navy/10 rounded-lg p-2">
                        <p className="text-[11px] text-navy/60">
                          <b className="text-navy">{EVENT_LABEL[r.event] || r.event}</b> · {new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} · {r.causer || 'Sistem'}
                        </p>
                        {fields.map((f) => (
                          <p key={f} className="text-[11px] text-navy/50">
                            {FIELD_LABEL[f]}: <span className="line-through text-red-500/70">{fmt(lama[f])}</span> <span className="text-emerald-600">→ {fmt(baru[f])}</span>
                          </p>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => onHapus(entri)} className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-4 py-2 hover:bg-red-600 hover:text-white">
                Hapus
              </button>
              <button onClick={() => onEdit(detail ?? entri)} className={primaryBtn}>
                Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Baris({ label, value }) {
  return (
    <>
      <dt className="text-navy/50 text-xs pt-0.5">{label}</dt>
      <dd className="text-navy whitespace-pre-line">{fmt(value)}</dd>
    </>
  )
}

/** Salin agenda dari tahun ajaran lain ke tahun ajaran yang sedang dipilih. */
export function DuplikasiKalenderModal({ tahunAjaran, tujuanId, onClose, onSaved }) {
  const kandidat = tahunAjaran.filter((t) => t.id !== tujuanId)
  const tujuan = tahunAjaran.find((t) => t.id === tujuanId)
  const [sumberId, setSumberId] = useState(kandidat[0] ? String(kandidat[0].id) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasil, setHasil] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.duplikasiKalender({ sumber_tahun_ajaran_id: Number(sumberId), tujuan_tahun_ajaran_id: tujuanId })
      setHasil(res)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-1">Duplikasi Kalender</h2>
        <p className="text-xs text-navy/50 mb-4">
          Menyalin agenda ke tahun ajaran <b>{tujuan?.nama}</b> dengan menggeser tanggal sebanyak selisih tahun. Hasil salinan berstatus Direncanakan dan ditandai "disalin". Hari Efektif tidak ikut disalin (atur di menu Hari Efektif), dan tanggal hari besar berbasis kalender lunar perlu disesuaikan manual.
        </p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {hasil ? (
          <div>
            <p className="text-sm font-semibold text-emerald-700">{hasil.message}</p>
            <div className="flex justify-end mt-4">
              <button onClick={onClose} className={primaryBtn}>
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Salin dari tahun ajaran">
              <select required value={sumberId} onChange={(e) => setSumberId(e.target.value)} className="input">
                {kandidat.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
                Batal
              </button>
              <button type="submit" disabled={saving || !sumberId} className={primaryBtn}>
                {saving ? 'Menyalin...' : 'Duplikasi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
