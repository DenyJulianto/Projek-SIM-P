import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'

/**
 * Beda dengan ConfirmActionModal biasa — menonaktifkan sekolah wajib
 * disertai alasan (dicatat di backend sebagai jejak audit), jadi butuh
 * modal khusus dengan input teks, bukan sekadar tombol konfirmasi ya/tidak.
 */
export default function NonaktifkanSekolahModal({ sekolah, loading, error, onConfirm, onClose }) {
  const [alasan, setAlasan] = useState('')
  const trimmed = alasan.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 p-6">
        <ModalCloseButton onClose={onClose} />

        <h2 className="text-lg font-bold text-navy mb-2">Nonaktifkan Sekolah</h2>
        <p className="text-sm text-navy/60 mb-4">
          <span className="font-semibold">{sekolah.nama_sekolah}</span> tidak akan bisa login ke
          sistem sampai diaktifkan kembali. Alasan wajib diisi sebagai catatan.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            <span className="block text-xs font-semibold text-navy/70 mb-1">
              Alasan Nonaktif <span className="text-red-500">*</span>
            </span>
            <textarea
              required
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="input"
              placeholder="Contoh: Tunggakan biaya langganan, permintaan pihak sekolah, dsb."
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
              disabled={loading || !trimmed}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Ya, Nonaktifkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
