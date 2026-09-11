import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function BackupRestore({ onBack }) {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [schedule, setSchedule] = useState({ frequency: 'off', time: '02:00', last_run_at: null })
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([api.listBackups(), api.getBackupSchedule()])
      .then(([b, s]) => {
        setBackups(b)
        setSchedule(s)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCreate() {
    setCreating(true)
    setError('')
    try {
      await api.createBackup()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(name) {
    if (!window.confirm(`Hapus backup "${name}"?`)) return
    try {
      await api.deleteBackup(name)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleSaveSchedule(e) {
    e.preventDefault()
    setSavingSchedule(true)
    setError('')
    try {
      const res = await api.updateBackupSchedule({ frequency: schedule.frequency, time: schedule.time })
      setSchedule(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
              <DatabaseIcon className="h-5.5 w-5.5 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-navy">Backup &amp; Pemulihan Data</h1>
              <p className="text-sm text-navy/50">Cadangkan dan pulihkan data sekolah.</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-1.5 bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors disabled:opacity-50 shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
          {creating ? 'Membuat Backup...' : 'Backup Sekarang'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <form
        onSubmit={handleSaveSchedule}
        className="bg-white rounded-2xl border border-navy/10 p-5 mb-4 flex flex-wrap items-end gap-4"
      >
        <div>
          <h2 className="text-sm font-bold text-navy mb-1">Jadwal Backup Otomatis</h2>
          <p className="text-xs text-navy/50 max-w-sm">
            Butuh cron server yang memanggil <code>php artisan schedule:run</code> tiap menit agar
            benar-benar berjalan otomatis (pengaturan standar hosting Laravel).
          </p>
        </div>
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Frekuensi</span>
          <select
            value={schedule.frequency}
            onChange={(e) => setSchedule((s) => ({ ...s, frequency: e.target.value }))}
            className="input"
          >
            <option value="off">Nonaktif</option>
            <option value="harian">Harian</option>
            <option value="mingguan">Mingguan</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Jam</span>
          <input
            type="time"
            value={schedule.time}
            onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))}
            className="input"
          />
        </label>
        <button
          type="submit"
          disabled={savingSchedule}
          className="text-sm font-semibold text-white bg-navy hover:bg-navy-light rounded-full px-5 py-2.5 disabled:opacity-50"
        >
          {savingSchedule ? 'Menyimpan...' : 'Simpan Jadwal'}
        </button>
        {schedule.last_run_at && (
          <p className="text-xs text-navy/40 w-full">
            Terakhir jalan otomatis: {new Date(schedule.last_run_at).toLocaleString('id-ID')}
          </p>
        )}
      </form>

      <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Riwayat Backup</h2>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama File</th>
              <th className="px-4 py-3">Ukuran</th>
              <th className="px-4 py-3">Dibuat</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Belum pernah backup.
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.name} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{b.name}</td>
                  <td className="px-4 py-3 text-navy/60">{formatSize(b.size)}</td>
                  <td className="px-4 py-3 text-navy/60">
                    {new Date(b.created_at * 1000).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => api.downloadBackup(b.name).catch((err) => window.alert(err.message))}
                        className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                      >
                        Unduh
                      </button>
                      <button
                        onClick={() => setRestoreTarget(b)}
                        className="text-xs font-semibold text-amber-700 border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-600 hover:text-white transition-colors"
                      >
                        Pulihkan
                      </button>
                      <button
                        onClick={() => handleDelete(b.name)}
                        className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {restoreTarget && (
        <RestoreConfirmModal
          backup={restoreTarget}
          onClose={() => setRestoreTarget(null)}
          onDone={() => {
            setRestoreTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function RestoreConfirmModal({ backup, onClose, onDone }) {
  const [confirmText, setConfirmText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleRestore() {
    setSaving(true)
    setError('')
    try {
      const res = await api.restoreBackup(backup.name)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        {result ? (
          <>
            <h2 className="text-base font-bold text-emerald-700 mb-2">Data Berhasil Dipulihkan</h2>
            <p className="text-sm text-navy/60 mb-4">
              Kondisi sebelum pemulihan disimpan otomatis sebagai backup baru:{' '}
              <span className="font-semibold text-navy">{result.safety_backup}</span> — jadi
              perubahan ini masih bisa dibatalkan kapan saja.
            </p>
            <button
              onClick={onDone}
              className="w-full bg-navy hover:bg-navy-light text-white text-sm font-semibold py-2.5 rounded-full"
            >
              Selesai
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <WarningIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">Pulihkan Data</h2>
                <p className="text-sm text-navy/60 mt-1">
                  Semua data saat ini akan <strong>ditimpa</strong> dengan isi backup{' '}
                  <span className="font-semibold text-navy">{backup.name}</span>. Kondisi saat ini
                  akan otomatis dicadangkan dulu sebelum ditimpa.
                </p>
              </div>
            </div>

            <label className="block mb-4">
              <span className="block text-xs font-semibold text-navy/70 mb-1">
                Ketik <code>PULIHKAN</code> untuk konfirmasi
              </span>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="input"
              />
            </label>

            {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
              >
                Batal
              </button>
              <button
                onClick={handleRestore}
                disabled={confirmText !== 'PULIHKAN' || saving}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-40"
              >
                {saving ? 'Memulihkan...' : 'Pulihkan Data'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function DatabaseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </svg>
  )
}

function PlusIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function WarningIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}
