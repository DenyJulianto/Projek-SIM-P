export default function LogoutConfirmModal({ onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-emerald-950/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-emerald-50 to-teal-100 px-8 pt-10 pb-8 text-center shadow-2xl shadow-emerald-900/30"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-emerald-300/30" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-teal-300/25" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/80 hover:bg-white border border-emerald-200 text-emerald-800 flex items-center justify-center transition-colors"
          aria-label="Tutup"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="relative mx-auto mb-6 h-24 w-24 rounded-full bg-emerald-100/80 ring-8 ring-emerald-50 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/40">
            <LogoutIcon className="h-8 w-8" />
          </div>
        </div>

        <h2 id="logout-title" className="relative text-2xl font-extrabold text-teal-900 mb-2">
          Keluar dari akun?
        </h2>
        <p className="relative text-sm text-navy/60 leading-relaxed mb-8">
          Anda perlu login kembali untuk mengakses halaman ini.
        </p>

        <div className="relative grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/80 hover:bg-white border border-emerald-200 text-teal-800 font-bold py-3 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 shadow-md shadow-emerald-700/30 transition-colors"
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function LogoutIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
