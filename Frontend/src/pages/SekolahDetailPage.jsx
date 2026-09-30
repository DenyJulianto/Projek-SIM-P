import { useState } from 'react'
import HapusSekolahModal from '../components/HapusSekolahModal'
import { api } from '../lib/api'

const JENJANG_OPTIONS = ['PAUD', 'TK', 'SD', 'SMP', 'SMA', 'SMK', 'SLB']
const AKREDITASI_OPTIONS = ['A', 'B', 'C', 'Belum Terakreditasi']
// Pilihan tahun berdiri: dari tahun berjalan mundur ke 1900.
const TAHUN_BERDIRI_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 1900 + 1 },
  (_, i) => new Date().getFullYear() - i,
)

function buildSekolahUrl(domain) {
  if (!domain) return ''
  return `${window.location.protocol}//${domain}${window.location.port ? `:${window.location.port}` : ''}/`
}

function toFormState(sekolah) {
  return {
    nama_sekolah: sekolah.nama_sekolah || '',
    npsn: sekolah.npsn || '',
    jenjang: sekolah.jenjang || '',
    status_sekolah: sekolah.status_sekolah || '',
    akreditasi: sekolah.akreditasi || '',
    alamat: sekolah.alamat || '',
    rt_rw: sekolah.rt_rw || '',
    kelurahan: sekolah.kelurahan || '',
    kecamatan: sekolah.kecamatan || '',
    kabupaten_kota: sekolah.kabupaten_kota || '',
    kode_pos: sekolah.kode_pos || '',
    provinsi: sekolah.provinsi || '',
    telepon: sekolah.telepon || '',
    email: sekolah.email || '',
    website: sekolah.website || '',
    nama_kepala_sekolah: sekolah.nama_kepala_sekolah || '',
    nama_yayasan: sekolah.nama_yayasan || '',
    tahun_berdiri: sekolah.tahun_berdiri || '',
    no_sk_pendirian: sekolah.no_sk_pendirian || '',
  }
}

export default function SekolahDetailPage({
  sekolah,
  onBack,
  onViewGuru,
  onViewSiswa,
  onUpdated,
  onDeleted,
}) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => toFormState(sekolah))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const domain = sekolah.domains?.[0]?.domain || ''
  const sekolahUrl = buildSekolahUrl(domain)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function startEdit() {
    setForm(toFormState(sekolah))
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        tahun_berdiri: form.tahun_berdiri !== '' ? Number(form.tahun_berdiri) : null,
      }
      const updated = await api.updateSekolah(sekolah.id, payload)
      onUpdated?.(updated)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await api.deleteSekolah(sekolah.id)
      onDeleted?.()
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  function handleCopy() {
    if (!sekolahUrl) return
    navigator.clipboard
      ?.writeText(sekolahUrl)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  const statusSekolahLabel =
    sekolah.status_sekolah === 'negeri'
      ? 'Negeri'
      : sekolah.status_sekolah === 'swasta'
        ? 'Swasta'
        : '-'

  const tahunBerdiriSk = [
    sekolah.tahun_berdiri ? `Tahun ${sekolah.tahun_berdiri}` : null,
    sekolah.no_sk_pendirian ? `SK No. ${sekolah.no_sk_pendirian}` : null,
  ]
    .filter(Boolean)
    .join(' — ')

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Data Sekolah
          </button>
          <h1 className="text-2xl font-extrabold text-navy">{sekolah.nama_sekolah}</h1>
          <p className="text-sm text-navy/50">NPSN {sekolah.npsn || '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              sekolah.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-navy/10 text-navy/60'
            }`}
          >
            {sekolah.status}
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

      {sekolah.status !== 'active' && sekolah.alasan_nonaktif && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-red-600 mb-1">Alasan Nonaktif</p>
          <p className="text-sm text-red-700">{sekolah.alasan_nonaktif}</p>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={onViewGuru}
          className="text-left bg-white rounded-2xl border border-navy/10 p-5 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-1">
            Jumlah Guru
          </p>
          <p className="text-3xl font-extrabold text-navy">{sekolah.jumlah_guru ?? '-'}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Lihat daftar guru →</p>
        </button>
        <button
          type="button"
          onClick={onViewSiswa}
          className="text-left bg-white rounded-2xl border border-navy/10 p-5 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-1">
            Jumlah Siswa
          </p>
          <p className="text-3xl font-extrabold text-navy">{sekolah.jumlah_siswa ?? '-'}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Lihat daftar siswa →</p>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-6 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4">Informasi Dasar Sekolah</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Nama Sekolah" value={sekolah.nama_sekolah || '-'} editing={editing}>
            <input
              type="text"
              value={form.nama_sekolah}
              onChange={(e) => update('nama_sekolah', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="NPSN" value={sekolah.npsn || '-'} editing={editing}>
            <input
              type="text"
              value={form.npsn}
              onChange={(e) => update('npsn', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Jenjang" value={sekolah.jenjang || '-'} editing={editing}>
            <select
              value={form.jenjang}
              onChange={(e) => update('jenjang', e.target.value)}
              className="input"
            >
              <option value="">Pilih jenjang</option>
              {JENJANG_OPTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Status Sekolah" value={statusSekolahLabel} editing={editing}>
            <select
              value={form.status_sekolah}
              onChange={(e) => update('status_sekolah', e.target.value)}
              className="input"
            >
              <option value="">Pilih status</option>
              <option value="negeri">Negeri</option>
              <option value="swasta">Swasta</option>
            </select>
          </Row>
          <Row label="Akreditasi" value={sekolah.akreditasi || '-'} editing={editing}>
            <select
              value={form.akreditasi}
              onChange={(e) => update('akreditasi', e.target.value)}
              className="input"
            >
              <option value="">Pilih akreditasi</option>
              {AKREDITASI_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Row>
        </dl>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-6 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4">Alamat Lengkap</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Alamat" value={sekolah.alamat || '-'} editing={editing}>
            <textarea
              rows={2}
              value={form.alamat}
              onChange={(e) => update('alamat', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="RT/RW" value={sekolah.rt_rw || '-'} editing={editing}>
            <input
              type="text"
              value={form.rt_rw}
              onChange={(e) => update('rt_rw', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Kelurahan" value={sekolah.kelurahan || '-'} editing={editing}>
            <input
              type="text"
              value={form.kelurahan}
              onChange={(e) => update('kelurahan', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Kecamatan" value={sekolah.kecamatan || '-'} editing={editing}>
            <input
              type="text"
              value={form.kecamatan}
              onChange={(e) => update('kecamatan', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Kota" value={sekolah.kabupaten_kota || '-'} editing={editing}>
            <input
              type="text"
              value={form.kabupaten_kota}
              onChange={(e) => update('kabupaten_kota', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Kode Pos" value={sekolah.kode_pos || '-'} editing={editing}>
            <input
              type="text"
              value={form.kode_pos}
              onChange={(e) => update('kode_pos', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Provinsi" value={sekolah.provinsi || '-'} editing={editing}>
            <input
              type="text"
              value={form.provinsi}
              onChange={(e) => update('provinsi', e.target.value)}
              className="input"
            />
          </Row>
        </dl>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-6 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4">Kontak dan Media Komunikasi</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Telepon / Fax" value={sekolah.telepon || '-'} editing={editing}>
            <input
              type="text"
              value={form.telepon}
              onChange={(e) => update('telepon', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Email" value={sekolah.email || '-'} editing={editing}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="input"
            />
          </Row>
          <Row label="Situs Web" value={sekolah.website || '-'} editing={editing}>
            <input
              type="text"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
              className="input"
            />
          </Row>
        </dl>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-6 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4">Pimpinan dan Kelembagaan</h2>
        <dl className="space-y-3 text-sm">
          <Row
            label="Nama Kepala Sekolah"
            value={sekolah.nama_kepala_sekolah || '-'}
            editing={editing}
          >
            <input
              type="text"
              value={form.nama_kepala_sekolah}
              onChange={(e) => update('nama_kepala_sekolah', e.target.value)}
              className="input"
            />
          </Row>
          <Row
            label="Nama Yayasan (Khusus Swasta)"
            value={sekolah.nama_yayasan || '-'}
            editing={editing}
          >
            <input
              type="text"
              value={form.nama_yayasan}
              onChange={(e) => update('nama_yayasan', e.target.value)}
              className="input"
            />
          </Row>
          <Row
            label="Tahun Berdiri / SK Pendirian"
            value={tahunBerdiriSk || '-'}
            editing={editing}
          >
            <div className="flex gap-2">
              <select
                value={form.tahun_berdiri}
                onChange={(e) => update('tahun_berdiri', e.target.value)}
                className="input"
              >
                <option value="">Tahun</option>
                {TAHUN_BERDIRI_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={form.no_sk_pendirian}
                onChange={(e) => update('no_sk_pendirian', e.target.value)}
                className="input"
                placeholder="No. SK Pendirian"
              />
            </div>
          </Row>
        </dl>
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
        <h2 className="text-sm font-bold text-navy mb-3">Link Sekolah</h2>
        {sekolahUrl ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2.5">
            <p className="flex-1 text-sm text-navy font-mono break-all">{sekolahUrl}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 text-xs font-semibold text-navy border border-navy/20 rounded-full px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
            >
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-navy/40">Belum ada domain terdaftar.</p>
        )}
      </div>

      {confirmingDelete && (
        <HapusSekolahModal
          sekolah={sekolah}
          loading={deleting}
          error={deleteError}
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
      {editing ? (
        <dd className="flex-1 max-w-[65%]">{children}</dd>
      ) : (
        <dd className="text-navy font-medium text-right pt-2">{value}</dd>
      )}
    </div>
  )
}
