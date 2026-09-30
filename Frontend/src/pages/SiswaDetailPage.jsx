import { useEffect, useState } from 'react'
import ConfirmActionModal from '../components/ConfirmActionModal'
import { api } from '../lib/api'

function toFormState(siswa, alamat, wali) {
  return {
    nis: siswa.nis || '',
    nama: siswa.nama || '',
    jenis_kelamin: siswa.jenis_kelamin || '',
    tahun_masuk: siswa.tahun_masuk || '',
    alamat: alamat?.alamat || '',
    rt_rw: alamat?.rt_rw || '',
    kelurahan: alamat?.kelurahan || '',
    kecamatan: alamat?.kecamatan || '',
    kota: alamat?.kota || '',
    kode_pos: alamat?.kode_pos || '',
    nama_wali: wali?.nama_wali || '',
    telepon_wali: wali?.telepon_wali || '',
  }
}

export default function SiswaDetailPage({
  siswa,
  onBack,
  backLabel = 'Data Siswa',
  onUpdated,
  onDeleted,
}) {
  const [wali, setWali] = useState(null)
  const [loadingWali, setLoadingWali] = useState(true)
  const [waliError, setWaliError] = useState('')
  const [alamat, setAlamat] = useState(null)
  const [loadingAlamat, setLoadingAlamat] = useState(true)
  const [alamatError, setAlamatError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => toFormState(siswa, null, null))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoadingWali(true)
    setWaliError('')
    api
      .getSiswaWali(siswa.sekolah_id, siswa.siswa_id)
      .then((res) => {
        if (!cancelled) setWali(res)
      })
      .catch((err) => {
        if (!cancelled) setWaliError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingWali(false)
      })

    setLoadingAlamat(true)
    setAlamatError('')
    api
      .getSiswaAlamat(siswa.sekolah_id, siswa.siswa_id)
      .then((res) => {
        if (!cancelled) setAlamat(res)
      })
      .catch((err) => {
        if (!cancelled) setAlamatError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingAlamat(false)
      })

    return () => {
      cancelled = true
    }
  }, [siswa.sekolah_id, siswa.siswa_id])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function startEdit() {
    setForm(toFormState(siswa, alamat, wali))
    setSaveError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setSaveError('')
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const payload = {
        ...form,
        tahun_masuk: form.tahun_masuk !== '' ? Number(form.tahun_masuk) : null,
      }
      const result = await api.updateSiswaDirektori(siswa.sekolah_id, siswa.siswa_id, payload)
      setAlamat({
        alamat: result.alamat,
        rt_rw: result.rt_rw,
        kelurahan: result.kelurahan,
        kecamatan: result.kecamatan,
        kota: result.kota,
        kode_pos: result.kode_pos,
      })
      setWali({ nama_wali: result.nama_wali, telepon_wali: result.telepon_wali })
      onUpdated?.({
        ...siswa,
        nis: result.nis,
        nama: result.nama,
        jenis_kelamin: result.jenis_kelamin,
        tahun_masuk: result.tahun_masuk,
      })
      setEditing(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await api.deleteSiswaDirektori(siswa.sekolah_id, siswa.siswa_id)
      onDeleted?.()
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke {backLabel}
          </button>
          <h1 className="text-2xl font-extrabold text-navy">{siswa.nama}</h1>
          <p className="text-sm text-navy/50">{siswa.sekolah?.nama_sekolah || '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              siswa.status === 'aktif'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-navy/10 text-navy/60'
            }`}
          >
            {siswa.status}
          </span>
          {!editing && (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-4 py-1.5 hover:bg-navy hover:text-white transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-4 py-1.5 hover:bg-red-50 transition-colors"
              >
                Hapus
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && <p className="text-red-600 text-sm mb-4">{saveError}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 p-6 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4">Identitas Siswa</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Nama" value={siswa.nama || '-'} editing={editing}>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => update('nama', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="NIS" value={siswa.nis || '-'} editing={editing}>
            <input
              type="text"
              value={form.nis}
              onChange={(e) => update('nis', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Jenis Kelamin" value={siswa.jenis_kelamin || '-'} editing={editing}>
            <select
              value={form.jenis_kelamin}
              onChange={(e) => update('jenis_kelamin', e.target.value)}
              className="input"
            >
              <option value="">Pilih</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Row>
          <Row label="Kelas" value={siswa.kelas || '-'} />
          <Row label="Tahun Masuk" value={siswa.tahun_masuk || '-'} editing={editing}>
            <input
              type="number"
              value={form.tahun_masuk}
              onChange={(e) => update('tahun_masuk', e.target.value)}
              className="input"
            />
          </Row>
        </dl>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-6 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4">Alamat Lengkap</h2>
        {loadingAlamat ? (
          <p className="text-sm text-navy/40">Memuat...</p>
        ) : alamatError ? (
          <p className="text-sm text-red-600">{alamatError}</p>
        ) : (
          <dl className="space-y-3 text-sm">
            <Row label="Alamat" value={alamat?.alamat || '-'} editing={editing}>
              <textarea
                rows={2}
                value={form.alamat}
                onChange={(e) => update('alamat', e.target.value)}
                className="input"
              />
            </Row>
            <Row label="RT/RW" value={alamat?.rt_rw || '-'} editing={editing}>
              <input
                type="text"
                value={form.rt_rw}
                onChange={(e) => update('rt_rw', e.target.value)}
                className="input"
              />
            </Row>
            <Row label="Kelurahan" value={alamat?.kelurahan || '-'} editing={editing}>
              <input
                type="text"
                value={form.kelurahan}
                onChange={(e) => update('kelurahan', e.target.value)}
                className="input"
              />
            </Row>
            <Row label="Kecamatan" value={alamat?.kecamatan || '-'} editing={editing}>
              <input
                type="text"
                value={form.kecamatan}
                onChange={(e) => update('kecamatan', e.target.value)}
                className="input"
              />
            </Row>
            <Row label="Kota" value={alamat?.kota || '-'} editing={editing}>
              <input
                type="text"
                value={form.kota}
                onChange={(e) => update('kota', e.target.value)}
                className="input"
              />
            </Row>
            <Row label="Kode Pos" value={alamat?.kode_pos || '-'} editing={editing}>
              <input
                type="text"
                value={form.kode_pos}
                onChange={(e) => update('kode_pos', e.target.value)}
                className="input"
              />
            </Row>
          </dl>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-6 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4">Data Orang Tua/Wali</h2>
        {loadingWali ? (
          <p className="text-sm text-navy/40">Memuat...</p>
        ) : waliError ? (
          <p className="text-sm text-red-600">{waliError}</p>
        ) : (
          <dl className="space-y-3 text-sm">
            <Row label="Nama Orang Tua/Wali" value={wali?.nama_wali || '-'} editing={editing}>
              <input
                type="text"
                value={form.nama_wali}
                onChange={(e) => update('nama_wali', e.target.value)}
                className="input"
              />
            </Row>
            <Row label="No. Telepon" value={wali?.telepon_wali || '-'} editing={editing}>
              <input
                type="text"
                value={form.telepon_wali}
                onChange={(e) => update('telepon_wali', e.target.value)}
                className="input"
              />
            </Row>
          </dl>
        )}
      </div>

      {editing && (
        <div className="flex justify-end gap-3 mb-6">
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-navy/10 p-6">
        <h2 className="text-sm font-bold text-navy mb-4">Sekolah</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Nama Sekolah" value={siswa.sekolah?.nama_sekolah || '-'} />
          <Row label="NPSN" value={siswa.sekolah?.npsn || '-'} />
          <Row label="Jenjang" value={siswa.sekolah?.jenjang || '-'} />
        </dl>
      </div>

      {confirmingDelete && (
        <ConfirmActionModal
          title="Hapus data siswa ini?"
          message={`"${siswa.nama}" beserta seluruh data terkait (nilai, absensi, tagihan, dsb.) akan dihapus permanen dari database sekolah. Tindakan ini tidak bisa dibatalkan.${deleteError ? `\n\n${deleteError}` : ''}`}
          confirmLabel="Ya, Hapus"
          tone="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => {
            setConfirmingDelete(false)
            setDeleteError('')
          }}
        />
      )}
    </div>
  )
}

function Row({ label, value, editing, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-navy/5 pb-3 last:border-0 last:pb-0">
      <dt className="text-navy/50 shrink-0 pt-2">{label}</dt>
      {editing && children ? (
        <dd className="flex-1 max-w-[65%]">{children}</dd>
      ) : (
        <dd className="text-navy font-medium text-right pt-2">{value}</dd>
      )}
    </div>
  )
}
