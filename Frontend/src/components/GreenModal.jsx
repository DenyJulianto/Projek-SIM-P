export function ModalShell({
  title,
  subtitle,
  header,
  cardClassName = '',
  onClose,
  children,
  size = 'md',
  dismissOnBackdrop = false,
}) {
  const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size]

  return (
    <div
      className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4"
      onClick={dismissOnBackdrop ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${width} max-h-[90vh] overflow-y-auto rounded-3xl border border-white/70 bg-gradient-to-br from-emerald-200 via-emerald-50 to-white p-6 shadow-2xl [scrollbar-width:thin] [scrollbar-color:#14a673_transparent] ${cardClassName}`}
      >
        {header ?? (
          <>
            <h2 className="text-lg font-extrabold text-navy">{title}</h2>
            {subtitle && <p className="text-xs text-navy/50 mt-1">{subtitle}</p>}
          </>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function ModalField({ label, icon: Icon, rightIcon: RightIcon, locked, hint, multiline, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`relative flex-1 ${Icon ? 'modal-field-icon' : ''} ${RightIcon || locked ? 'modal-field-right' : ''}`}>
          {Icon && (
            <span
              className={`absolute left-3 text-navy-light pointer-events-none ${multiline ? 'top-3' : 'top-1/2 -translate-y-1/2'}`}
            >
              <Icon className="h-4 w-4" />
            </span>
          )}
          {children}
          {(RightIcon || locked) && (
            <span
              className={`absolute right-3 pointer-events-none ${locked ? 'text-navy/40' : 'text-navy-light'} ${
                multiline ? 'top-3' : 'top-1/2 -translate-y-1/2'
              }`}
            >
              {locked ? <LockIcon className="h-4 w-4" /> : <RightIcon className="h-4 w-4" />}
            </span>
          )}
        </div>
        {hint && (
          <span title={hint} className="text-navy/40 hover:text-navy-light shrink-0 cursor-help">
            <HelpIcon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
    </label>
  )
}

export function RupiahInput({ value, onChange, className = 'modal-input', ...props }) {
  const digits = String(value ?? '').replace(/\D/g, '')

  return (
    <input
      type="text"
      inputMode="numeric"
      value={digits ? `Rp ${Number(digits).toLocaleString('id-ID')}` : ''}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      placeholder="Rp 0"
      className={className}
      {...props}
    />
  )
}

export function PillToggle({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const active = value === opt.key
        const Icon = opt.icon
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              active
                ? 'bg-navy-light text-white border-navy-light shadow-sm'
                : 'bg-white text-navy border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function ModalError({ children }) {
  return (
    <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm px-3 py-2 mb-3">{children}</p>
  )
}

export function ModalActions({
  onCancel,
  onSubmit,
  saving = false,
  disabled = false,
  cancelLabel = 'Batal',
  submitLabel = 'Simpan',
  savingLabel = 'Menyimpan...',
  submitIcon: SubmitIcon = SaveIcon,
  danger = false,
  hideSubmit = false,
}) {
  return (
    <div className="flex justify-end gap-3 pt-5">
      <button
        type="button"
        onClick={onCancel}
        className="border border-navy/20 bg-white text-navy hover:bg-navy/5 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
      >
        {cancelLabel}
      </button>
      {!hideSubmit && (
        <button
          type={onSubmit ? 'button' : 'submit'}
          onClick={onSubmit}
          disabled={saving || disabled}
          className={`inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-md transition-colors disabled:opacity-50 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-navy hover:bg-navy/90'
          }`}
        >
          <SubmitIcon className="h-4 w-4" />
          {saving ? savingLabel : submitLabel}
        </button>
      )}
    </div>
  )
}

function svg(children, extra = {}) {
  return function Icon(props) {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...extra}>
        {children}
      </svg>
    )
  }
}

export const SaveIcon = svg(
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </>
)
export const LockIcon = svg(
  <>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </>
)
export const HelpIcon = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />
  </>
)
export const CalendarIcon = svg(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>
)
export const CardIcon = svg(
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </>
)
export const MoneyIcon = svg(
  <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
  </>
)
export const PencilIcon = svg(
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </>
)
export const UserIcon = svg(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </>
)
export const UsersIcon = svg(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    <path d="M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5M18.5 13.7c2 .7 3.5 2.8 3.5 6.3" />
  </>
)
export const TagIcon = svg(
  <>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
    <circle cx="7.5" cy="7.5" r="1" />
  </>
)
export const NoteIcon = svg(
  <>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </>
)
export const BankIcon = svg(
  <>
    <path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" />
  </>
)
export const HashIcon = svg(
  <>
    <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />
  </>
)
export const MapPinIcon = svg(
  <>
    <path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </>
)
export const StoreIcon = svg(
  <>
    <path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9" />
  </>
)
export const QrIcon = svg(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v0M14 20h3M20 17v4" />
  </>
)
export const BanIcon = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.6 5.6 12.8 12.8" />
  </>
)
export const WalletIcon = svg(
  <>
    <path d="M3 7a2 2 0 0 1 2-2h13v4" />
    <path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z" />
    <circle cx="16" cy="14.5" r="1" />
  </>
)
