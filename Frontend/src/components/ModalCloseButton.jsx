// Tombol tutup bulat di pojok kanan atas modal bertema (gaya modal Guru Mapel).
export default function ModalCloseButton({ onClose }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Tutup"
      className="absolute top-5 right-5 z-10 h-8 w-8 rounded-full bg-white/70 hover:bg-white text-navy/50 hover:text-navy flex items-center justify-center transition-colors"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  )
}
