import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { TAGIHAN_JENIS, jenisLabel } from '../lib/tagihanJenis'
import {
  CalendarIcon,
  CardIcon,
  MoneyIcon,
  ModalActions,
  ModalError,
  ModalField,
  ModalShell,
  PencilIcon,
  PillToggle,
  RupiahInput,
  UserIcon,
  UsersIcon,
} from './GreenModal'

const TARGET_OPTIONS = [
  { key: 'siswa', label: 'Satu Siswa', icon: UserIcon },
  { key: 'kelas', label: 'Satu Kelas', icon: UsersIcon },
  { key: 'semua', label: 'Semua siswa aktif', icon: UsersIcon },
]

export default function TagihanFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [kelasList, setKelasList] = useState([])
  const [siswaList, setSiswaList] = useState([])
  const [judulDiubah, setJudulDiubah] = useState(isEdit)
  const [form, setForm] = useState({
    target: 'siswa',
    kelas_id: '',
    siswa_id: item?.siswa_id || '',
    jenis: item?.jenis || 'spp',
    judul: item?.judul || '',
    periode: item?.periode || '',
    jumlah: item?.jumlah ? Math.round(Number(item.jumlah)) : '',
    jatuh_tempo: item?.jatuh_tempo?.slice(0, 10) || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) return
    api.listKelasAll().then((r) => setKelasList(r.data)).catch(() => {})
  }, [isEdit])

  useEffect(() => {
    if (isEdit || form.target !== 'siswa' || !form.kelas_id) return
    api.listSiswaByKelas(form.kelas_id).then((r) => setSiswaList(r.data)).catch(() => setSiswaList([]))
  }, [isEdit, form.target, form.kelas_id])

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'kelas_id') next.siswa_id = ''
      if (!judulDiubah && (field === 'jenis' || field === 'periode')) {
        next.judul = `${jenisLabel(next.jenis)} ${next.periode}`.trim()
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const shared = {
        jenis: form.jenis,
        judul: form.judul,
        periode: form.periode || null,
        jumlah: Number(form.jumlah),
        jatuh_tempo: form.jatuh_tempo || null,
      }
      if (isEdit) {
        await api.updateTagihan(item.id, shared)
        onSaved('Tagihan berhasil diperbarui.')
      } else {
        const res = await api.createTagihan({
          ...shared,
          target: form.target,
          siswa_id: form.target === 'siswa' ? Number(form.siswa_id) : null,
          kelas_id: form.target === 'kelas' ? Number(form.kelas_id) : null,
        })
        onSaved(
          res.dilewati > 0
            ? `${res.message} ${res.dilewati} siswa dilewati karena sudah punya tagihan yang sama.`
            : res.message
        )
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Edit Tagihan' : 'Buat Tagihan Baru'} size="lg">
      {error && <ModalError>{error}</ModalError>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isEdit ? (
          <p className="text-sm text-navy/60">
            Siswa: <span className="font-semibold text-navy">{item.siswa?.nama || '-'}</span>
          </p>
        ) : (
          <>
            <div>
              <span className="block text-xs font-semibold text-navy/70 mb-1.5">Dikenakan kepada</span>
              <PillToggle options={TARGET_OPTIONS} value={form.target} onChange={(v) => update('target', v)} />
            </div>

            {form.target !== 'semua' && (
              <ModalField label="Kelas" icon={UsersIcon} hint="Pilih kelas yang akan dikenai tagihan.">
                <select
                  required
                  value={form.kelas_id}
                  onChange={(e) => update('kelas_id', e.target.value)}
                  className="modal-input"
                >
                  <option value="">Pilih Kelas...</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </ModalField>
            )}

            {form.target === 'siswa' && (
              <ModalField label="Siswa" icon={UserIcon} locked={!form.kelas_id}>
                <select
                  required
                  disabled={!form.kelas_id}
                  value={form.siswa_id}
                  onChange={(e) => update('siswa_id', e.target.value)}
                  className="modal-input"
                >
                  <option value="">{form.kelas_id ? 'Pilih siswa...' : 'Pilih kelas dulu'}</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </ModalField>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Jenis Tagihan" icon={CardIcon}>
            <select value={form.jenis} onChange={(e) => update('jenis', e.target.value)} className="modal-input">
              {TAGIHAN_JENIS.map((j) => (
                <option key={j.key} value={j.key}>
                  {j.label}
                </option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Periode" rightIcon={CalendarIcon} hint="Teks bebas, mis. September 2026 atau Semester Ganjil.">
            <input
              type="text"
              value={form.periode}
              onChange={(e) => update('periode', e.target.value)}
              className="modal-input"
              placeholder="mis. September 2026"
              maxLength={100}
            />
          </ModalField>
        </div>

        <ModalField label="Judul Tagihan" rightIcon={PencilIcon}>
          <input
            type="text"
            required
            value={form.judul}
            onChange={(e) => {
              setJudulDiubah(true)
              update('judul', e.target.value)
            }}
            className="modal-input"
            placeholder="mis. SPP September 2026"
          />
        </ModalField>

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Nominal (Rp)" icon={MoneyIcon}>
            <RupiahInput required value={form.jumlah} onChange={(v) => update('jumlah', v)} />
          </ModalField>
          <ModalField label="Jatuh Tempo">
            <input
              type="date"
              value={form.jatuh_tempo}
              onChange={(e) => update('jatuh_tempo', e.target.value)}
              className="modal-input"
            />
          </ModalField>
        </div>

        <ModalActions onCancel={onClose} saving={saving} />
      </form>
    </ModalShell>
  )
}
