import ModalCloseButton from './ModalCloseButton'
import { TONE } from './perpusKonstanta'

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] font-semibold text-navy/60 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-navy/40 mt-1">{hint}</span>}
    </label>
  )
}

export function Btn({ children, onClick, disabled, utama, bahaya, kecil, type = 'button', title }) {
  const tampil = utama
    ? 'bg-navy text-white hover:bg-navy-light'
    : bahaya
      ? 'border border-red-300 text-red-600 hover:bg-red-50'
      : 'border border-navy/20 text-navy hover:bg-navy/5'
  return (
    <button type={type} title={title} onClick={onClick} disabled={disabled} className={`font-semibold rounded-full disabled:opacity-40 whitespace-nowrap ${kecil ? 'text-xs px-3 py-1' : 'text-sm px-4 py-2'} ${tampil}`}>
      {children}
    </button>
  )
}

export function Badge({ tone = 'abu', children }) {
  return <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${TONE[tone] ?? TONE.abu}`}>{children}</span>
}

export function ModalShell({ title, onClose, children, lebar = 'max-w-2xl', footer }) {
  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className={`tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl ${lebar} w-full max-h-[92vh] flex flex-col shadow-2xl shadow-teal-900/20 overflow-hidden`}>
        <ModalCloseButton onClose={onClose} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-3 border-t border-navy/10 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Pesan({ error, info }) {
  return (
    <>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</div>}
      {info && <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">{info}</div>}
    </>
  )
}

export function Kartu({ label, nilai, sub, tone }) {
  const warna = { hijau: 'from-emerald-50 border-emerald-100', biru: 'from-sky-50 border-sky-100', ungu: 'from-violet-50 border-violet-100', oranye: 'from-orange-50 border-orange-100', merah: 'from-red-50 border-red-100', teal: 'from-teal-50 border-teal-100' }[tone] ?? 'from-navy/5 border-navy/10'
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${warna} to-white p-4`}>
      <p className="text-xs text-navy/60">{label}</p>
      <p className="text-2xl font-extrabold text-navy mt-1 leading-none">{nilai ?? '-'}</p>
      {sub && <p className="text-[11px] text-navy/40 mt-1.5">{sub}</p>}
    </div>
  )
}

export function Kosong({ children }) {
  return <p className="text-sm text-navy/40 text-center py-10">{children}</p>
}

export function Pagination({ result, page, onPage }) {
  if (!result || result.last_page <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-navy/10 text-xs text-navy/50">
      <span>
        Halaman {result.current_page} dari {result.last_page} ({result.total} data)
      </span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-3 py-1 rounded-lg border border-navy/15 disabled:opacity-30">
          ‹ Sebelumnya
        </button>
        <button disabled={page >= result.last_page} onClick={() => onPage(page + 1)} className="px-3 py-1 rounded-lg border border-navy/15 disabled:opacity-30">
          Berikutnya ›
        </button>
      </div>
    </div>
  )
}

export function BatangMendatar({ data, warna = 'bg-emerald-500', total, labelKey = 'nama' }) {
  if (!data || data.length === 0) return <Kosong>Belum ada data.</Kosong>
  const maks = Math.max(1, ...data.map((d) => d.jumlah ?? d.total ?? 0))
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const jumlah = d.jumlah ?? d.total ?? 0
        return (
          <div key={d[labelKey] ?? d.bulan ?? i}>
            <div className="flex justify-between text-xs text-navy/70 mb-0.5">
              <span className="truncate pr-2">{d[labelKey] ?? d.bulan ?? d.judul}</span>
              <span className="font-semibold text-navy">
                {jumlah}
                {total ? ` (${Math.round((jumlah / total) * 100)}%)` : ''}
              </span>
            </div>
            <div className="h-2 bg-navy/5 rounded-full overflow-hidden">
              <div className={`h-full ${warna} rounded-full`} style={{ width: `${(jumlah / maks) * 100}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Panel({ judul, children, className = '' }) {
  return (
    <section className={`bg-white rounded-2xl border border-navy/5 shadow-sm p-5 ${className}`}>
      <h3 className="text-sm font-bold text-navy mb-3">{judul}</h3>
      {children}
    </section>
  )
}
