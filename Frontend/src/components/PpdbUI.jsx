import { useState } from 'react'
import { LABEL_EVENT, TONE, waktu } from './ppdbKonstanta'

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
  const tampil = utama ? 'bg-navy text-white hover:bg-navy-light' : bahaya ? 'border border-red-300 text-red-600 hover:bg-red-50' : 'border border-navy/20 text-navy hover:bg-navy/5'
  return (
    <button type={type} title={title} onClick={onClick} disabled={disabled} className={`font-semibold rounded-full disabled:opacity-40 whitespace-nowrap ${kecil ? 'text-xs px-3 py-1' : 'text-sm px-4 py-2'} ${tampil}`}>
      {children}
    </button>
  )
}

export function Badge({ tone = 'abu', children }) {
  return <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${TONE[tone] ?? TONE.abu}`}>{children}</span>
}

export function ModalShell({ title, onClose, children, lebar = 'max-w-3xl', footer }) {
  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl ${lebar} w-full max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none" aria-label="Tutup">
            ×
          </button>
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

const teks = (v) => (v === null || v === undefined || v === '' ? '-' : typeof v === 'object' ? JSON.stringify(v) : String(v))

/** Daftar riwayat perubahan dari activity log (siapa, kapan, apa), dengan diff sebelum/sesudah bila ada. */
export function RiwayatList({ items, kosong = 'Belum ada riwayat.', label = LABEL_EVENT }) {
  if (!items || items.length === 0) return <Kosong>{kosong}</Kosong>
  return (
    <ol className="space-y-3">
      {items.map((r) => {
        const p = r.properties ?? {}
        const sebelum = p.sebelum && typeof p.sebelum === 'object' ? p.sebelum : null
        const sesudah = p.sesudah && typeof p.sesudah === 'object' ? p.sesudah : null
        return (
          <li key={r.id} className="border-l-2 border-navy/15 pl-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy">{label[r.event] ?? r.event}</span>
              <span className="text-[11px] text-navy/40">
                {waktu(r.created_at)} · {r.causer ?? 'Sistem'}
              </span>
            </div>
            <p className="text-sm text-navy mt-0.5">{r.description}</p>
            {p.catatan && <p className="text-xs text-navy/60 mt-0.5">Catatan: {p.catatan}</p>}
            {p.alasan && <p className="text-xs text-navy/60 mt-0.5">Alasan: {p.alasan}</p>}
            {sebelum && sesudah && (
              <ul className="mt-1 text-xs text-navy/60 space-y-0.5">
                {Object.keys(sesudah).map((k) => (
                  <li key={k}>
                    {k.replaceAll('_', ' ')}: <span className="line-through opacity-60">{teks(sebelum[k])}</span> → <span className="font-semibold">{teks(sesudah[k])}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** Pesan siap kirim (WhatsApp/email/salin) untuk pemberitahuan hasil seleksi dan pengingat. */
export function ModalPesan({ judul, hasil, onClose }) {
  const [salin, setSalin] = useState(false)
  return (
    <ModalShell title={judul} onClose={onClose} lebar="max-w-lg">
      <p className="text-xs text-navy/50 mb-2">Sistem belum terhubung ke gateway WhatsApp/email, jadi pesan disiapkan lalu dikirim lewat aplikasi Anda. Waktu penyiapan dicatat sebagai riwayat pemberitahuan.</p>
      <pre className="whitespace-pre-wrap text-sm bg-navy/5 rounded-xl p-3 text-navy font-sans">{hasil.pesan}</pre>
      <div className="flex gap-2 flex-wrap mt-3">
        {hasil.whatsapp ? (
          <a href={hasil.whatsapp} target="_blank" rel="noreferrer" className="text-sm font-semibold px-4 py-2 rounded-full bg-emerald-600 text-white">
            Kirim via WhatsApp
          </a>
        ) : (
          <span className="text-xs text-navy/40 self-center">Nomor HP tidak tersedia</span>
        )}
        {hasil.email && (
          <a href={hasil.email} className="text-sm font-semibold px-4 py-2 rounded-full border border-navy/20 text-navy">
            Kirim via Email
          </a>
        )}
        <Btn
          onClick={() => {
            navigator.clipboard?.writeText(hasil.pesan)
            setSalin(true)
          }}
        >
          {salin ? 'Tersalin ✓' : 'Salin Pesan'}
        </Btn>
      </div>
    </ModalShell>
  )
}

