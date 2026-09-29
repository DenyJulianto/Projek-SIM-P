import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'

/**
 * Menghapus sekolah men-drop SELURUH database tenant-nya (guru, siswa,
 * nilai, keuangan, semuanya) secara permanen dan langsung — bukan soft
 * delete. Konfirmasi ya/tidak biasa terlalu mudah diklik tanpa sadar untuk
 * tindakan sebesar ini, jadi Super Admin wajib mengetik ulang nama sekolah
 * persis sama sebelum tombol hapus aktif, pola yang sama seperti konfirmasi
 * hapus repository di GitHub.
 */
export default function HapusSekolahModal({ sekolah, loading, error, onConfirm, onClose }) {
  const [confirmText, setConfirmText] = useState('')
  const matches = confirmText === sekolah.nama_sekolah

  function handleSubmit(e) {
    e.preventDefault()
    if (!matches) return
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-red-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-red-900/20 p-6">
        <ModalCloseButton onClose={onClose} />

        <h2 className="text-lg font-bold text-red-700 mb-2">Hapus Sekolah Permanen</h2>
        <p className="text-sm text-navy/60 mb-4">
          Semua data <span className="font-semibold">{sekolah.nama_sekolah}</span> — guru, siswa,
          nilai, keuangan, dan seluruh data lainnya — akan dihapus permanen dan{' '}
          <span className="font-semibold text-red-600">tidak bisa dikembalikan</span>. Sekolah juga
          tidak akan bisa login lagi.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            <span className="block text-xs font-semibold text-navy/70 mb-1">
              Ketik <span className="font-mono">{sekolah.nama_sekolah}</span> untuk konfirmasi
            </span>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="input"
              autoComplete="off"
              autoFocus
            />
          </label>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-navy/5 hover:bg-navy/10 text-navy font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !matches}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Menghapus...' : 'Hapus Permanen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
