import { useEffect, useState } from 'react'
import ConfirmActionModal from '../components/ConfirmActionModal'
import { api } from '../lib/api'

function toFormState(guru, alamat) {
  return {
    nip: guru.nip || '',
    nuptk: guru.nuptk || '',
    nama: guru.nama || '',
    gelar: guru.gelar || '',
    jenis_kelamin: guru.jenis_kelamin || '',
    jabatan: guru.jabatan || '',
    mata_pelajaran: guru.mata_pelajaran || '',
    status_kepegawaian: guru.status_kepegawaian || '',
    pendidikan_terakhir: guru.pendidikan_terakhir || '',
    no_telepon: guru.no_telepon || '',
    alamat: alamat?.alamat || '',
    rt_rw: alamat?.rt_rw || '',
    kelurahan: alamat?.kelurahan || '',
    kecamatan: alamat?.kecamatan || '',
    kota: alamat?.kota || '',
    kode_pos: alamat?.kode_pos || '',
  }
}

export default function GuruDetailPage({
  guru,
  onBack,
  backLabel = 'Data Guru',
  onUpdated,
  onDeleted,
}) {
  const [alamat, setAlamat] = useState(null)
  const [loadingAlamat, setLoadingAlamat] = useState(true)
  const [alamatError, setAlamatError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => toFormState(guru, null))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoadingAlamat(true)
    setAlamatError('')
    api
      .getGuruAlamat(guru.sekolah_id, guru.guru_id)
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
  }, [guru.sekolah_id, guru.guru_id])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function startEdit() {
    setForm(toFormState(guru, alamat))
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
      const result = await api.updateGuruDirektori(guru.sekolah_id, guru.guru_id, form)
      setAlamat({
        alamat: result.alamat,
        rt_rw: result.rt_rw,
        kelurahan: result.kelurahan,
        kecamatan: result.kecamatan,
        kota: result.kota,
        kode_pos: result.kode_pos,
      })
      onUpdated?.({
        ...guru,
        nip: result.nip,
        nuptk: result.nuptk,
        nama: result.nama,
        gelar: result.gelar,
        jenis_kelamin: result.jenis_kelamin,
        jabatan: result.jabatan,
        mata_pelajaran: result.mata_pelajaran,
        status_kepegawaian: result.status_kepegawaian,
        pendidikan_terakhir: result.pendidikan_terakhir,
        no_telepon: result.no_telepon,
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
      await api.deleteGuruDirektori(guru.sekolah_id, guru.guru_id)
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
          <h1 className="text-2xl font-extrabold text-navy">
            {guru.nama}
            {guru.gelar ? `, ${guru.gelar}` : ''}
          </h1>
          <p className="text-sm text-navy/50">{guru.sekolah?.nama_sekolah || '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              guru.status === 'aktif'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-navy/10 text-navy/60'
            }`}
          >
            {guru.status}
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
        <h2 className="text-sm font-bold text-navy mb-4">Identitas Guru</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Nama" value={guru.nama || '-'} editing={editing}>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => update('nama', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Gelar" value={guru.gelar || '-'} editing={editing}>
            <input
              type="text"
              value={form.gelar}
              onChange={(e) => update('gelar', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="NIP" value={guru.nip || '-'} editing={editing}>
            <input
              type="text"
              value={form.nip}
              onChange={(e) => update('nip', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="NUPTK" value={guru.nuptk || '-'} editing={editing}>
            <input
              type="text"
              value={form.nuptk}
              onChange={(e) => update('nuptk', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Jenis Kelamin" value={guru.jenis_kelamin || '-'} editing={editing}>
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
          <Row label="Jabatan" value={guru.jabatan || '-'} editing={editing}>
            <input
              type="text"
              value={form.jabatan}
              onChange={(e) => update('jabatan', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Mata Pelajaran" value={guru.mata_pelajaran || '-'} editing={editing}>
            <input
              type="text"
              value={form.mata_pelajaran}
              onChange={(e) => update('mata_pelajaran', e.target.value)}
              className="input"
            />
          </Row>
          <Row
            label="Status Kepegawaian"
            value={guru.status_kepegawaian || '-'}
            editing={editing}
          >
            <input
              type="text"
              value={form.status_kepegawaian}
              onChange={(e) => update('status_kepegawaian', e.target.value)}
              className="input"
            />
          </Row>
          <Row
            label="Pendidikan Terakhir"
            value={guru.pendidikan_terakhir || '-'}
            editing={editing}
          >
            <input
              type="text"
              value={form.pendidikan_terakhir}
              onChange={(e) => update('pendidikan_terakhir', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="No. Telepon" value={guru.no_telepon || '-'} editing={editing}>
            <input
              type="text"
              value={form.no_telepon}
              onChange={(e) => update('no_telepon', e.target.value)}
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
          <Row label="Nama Sekolah" value={guru.sekolah?.nama_sekolah || '-'} />
          <Row label="NPSN" value={guru.sekolah?.npsn || '-'} />
          <Row label="Jenjang" value={guru.sekolah?.jenjang || '-'} />
        </dl>
      </div>

      {confirmingDelete && (
        <ConfirmActionModal
          title="Hapus data guru ini?"
          message={`"${guru.nama}" beserta seluruh data terkait (jadwal, nilai, dsb.) akan dihapus permanen dari database sekolah. Tindakan ini tidak bisa dibatalkan.${deleteError ? `\n\n${deleteError}` : ''}`}
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
