import ModalCloseButton from './ModalCloseButton'
export default function ConfirmActionModal({
  title = 'Apakah Anda yakin?',
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  const isDanger = tone === 'danger'

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-sm w-full shadow-2xl shadow-teal-900/20 p-8 text-center">
<ModalCloseButton onClose={onClose} />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-navy/30 hover:text-navy/60 transition-colors"
          aria-label="Tutup"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div
          className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-5 ${
            isDanger ? 'bg-red-500' : 'bg-navy-light'
          }`}
        >
          {isDanger ? (
            <AlertIcon className="h-8 w-8 text-white" />
          ) : (
            <CheckIcon className="h-8 w-8 text-white" />
          )}
        </div>

        <h2 className="text-xl font-extrabold text-navy mb-2">{title}</h2>
        {message && <p className="text-sm text-navy/60 mb-7">{message}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-navy/5 hover:bg-navy/10 text-navy font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 ${
              isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-navy-light hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function AlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}
