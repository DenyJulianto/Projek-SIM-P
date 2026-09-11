export default function LogoutConfirmModal({ onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-8 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-navy/30 hover:text-navy/60 transition-colors"
          aria-label="Tutup"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="mx-auto h-16 w-16 rounded-full bg-red-500 flex items-center justify-center mb-5">
          <CloseIcon className="h-8 w-8 text-white" strokeWidth={3} />
        </div>

        <h2 className="text-xl font-extrabold text-navy mb-2">Apakah Anda yakin?</h2>
        <p className="text-sm text-navy/60 mb-7">
          Anda perlu login kembali untuk mengakses halaman ini.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-navy/5 hover:bg-navy/10 text-navy font-bold py-3 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseIcon({ strokeWidth = 2, ...props }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
