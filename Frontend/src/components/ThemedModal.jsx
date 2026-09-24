import { useState } from 'react'
import { createPortal } from 'react-dom'

// Tampilan modal seragam untuk dashboard guru (gaya yang sama dengan modal
// Wali Kelas / Modul Ajar): latar teal blur, kartu gradien putih-emerald.
export function ThemedModalShell({ children, onClose, maxWidth = 'max-w-md' }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-gradient-to-br from-white via-emerald-50 to-teal-100 border border-white rounded-3xl w-full ${maxWidth} shadow-2xl shadow-teal-900/30 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

function ConfirmDeleteModal({ title, message, confirmLabel = 'Hapus', onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
      onCancel()
    }
  }

  return (
    <ThemedModalShell onClose={() => !busy && onCancel()}>
      <div className="px-8 pt-8 pb-7 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 ring-8 ring-emerald-50 flex items-center justify-center mb-4">
          <div className="h-9 w-9 rounded-full border-2 border-teal-600 text-teal-600 flex items-center justify-center text-lg font-bold">
            !
          </div>
        </div>
        <h2 className="text-2xl font-bold text-teal-900">{title}</h2>
        <p className="text-sm text-navy/60 mt-2 leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-4 mt-7">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl bg-white/80 hover:bg-white border border-teal-200 text-teal-800 font-semibold py-3 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-semibold py-3 shadow-md shadow-teal-600/30 disabled:opacity-50"
          >
            {busy ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </ThemedModalShell>
  )
}

// Pengganti window.confirm: `ask({ title, message }, onConfirm)` membuka modal,
// `element` harus dirender di dalam komponen pemakai.
export function useThemedConfirm() {
  const [state, setState] = useState(null)
  const ask = (opts, onConfirm) => setState({ ...opts, onConfirm })
  const element = state ? (
    <ConfirmDeleteModal
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      onCancel={() => setState(null)}
      onConfirm={state.onConfirm}
    />
  ) : null
  return [ask, element]
}

// Popup pemberitahuan satu tombol (pengganti window.alert) dengan tema yang sama.
export function ThemedInfoModal({ title, message, buttonLabel = 'Mengerti', onClose }) {
  return (
    <ThemedModalShell onClose={onClose}>
      <div className="px-8 pt-8 pb-7 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 ring-8 ring-emerald-50 flex items-center justify-center mb-4">
          <div className="h-9 w-9 rounded-full border-2 border-teal-600 text-teal-600 flex items-center justify-center text-lg font-bold">
            !
          </div>
        </div>
        <h2 className="text-2xl font-bold text-teal-900">{title}</h2>
        <p className="text-sm text-navy/60 mt-2 leading-relaxed">{message}</p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="mt-7 w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-semibold py-3 shadow-md shadow-teal-600/30"
        >
          {buttonLabel}
        </button>
      </div>
    </ThemedModalShell>
  )
}
