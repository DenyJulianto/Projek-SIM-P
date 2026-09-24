import { useState } from 'react'
import { api } from '../lib/api'
import { CalendarIcon, CardIcon, HashIcon, ModalShell, MoneyIcon, NoteIcon, UserIcon } from './GreenModal'

const METODE_LABEL = {
  tunai: 'Tunai',
  transfer: 'Transfer Bank',
  qris: 'QRIS',
  virtual_account: 'Virtual Account',
  lainnya: 'Lainnya',
}

function formatRupiah(value) {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`
}

function formatTanggalPanjang(value) {
  if (!value) return '-'
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatJam(value) {
  if (!value) return null
  const jam = new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })
  return `${jam.replace('.', ':')} WIB`
}

const STATUS_BADGE = {
  menunggu: { label: 'Menunggu Verifikasi', className: 'bg-amber-100 text-amber-700' },
  diverifikasi: { label: 'Terverifikasi', className: 'bg-emerald-100 text-emerald-700' },
  ditolak: { label: 'Ditolak', className: 'bg-red-100 text-red-600' },
}

export default function PembayaranDetailModal({ item, onClose }) {
  const [zoom, setZoom] = useState(false)
  const siswa = item.siswa
  const badge = STATUS_BADGE[item.status] || STATUS_BADGE.diverifikasi
  const buktiPath = item.buktiPath
  const buktiUrl = buktiPath ? api.buktiPembayaranUrl(buktiPath) : null
  const isPdf = buktiPath?.toLowerCase().endsWith('.pdf')

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="h-11 w-11 rounded-2xl bg-navy-light text-white flex items-center justify-center shrink-0">
          <CardIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-navy">Detail Pembayaran</h2>
          <p className="text-xs text-navy/50">Informasi lengkap transaksi pembayaran siswa</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${badge.className}`}>
          <CheckBadgeIcon className="h-3.5 w-3.5" />
          {badge.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="print:hidden text-navy/40 hover:text-navy hover:bg-white/70 rounded-full p-1.5 transition-colors"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <ModalShell header={header} cardClassName="print-area" onClose={onClose} dismissOnBackdrop size="lg">
        <div className="bg-white/80 rounded-2xl border border-emerald-100 px-4 py-2">
          <DetailLine icon={CalendarIcon} label="Tanggal" value={formatTanggalPanjang(item.tanggal)} sub={formatJam(item.jam)} />
          <DetailLine icon={UserIcon} label="Nama Siswa" value={siswa?.nama || '-'} />
          <DetailLine icon={HashIcon} label="NISN" value={siswa?.nisn || siswa?.nis || '-'} />
          <div className="border-t border-emerald-100 my-1" />
          <DetailLine icon={NoteIcon} label="Tagihan" value={item.tagihanJudul || '-'} sub={item.periode} />
          <DetailLine icon={CardIcon} label="Metode Pembayaran" value={METODE_LABEL[item.metode] || item.metode || '-'} />
          <DetailLine icon={MoneyIcon} label="Jumlah" value={formatRupiah(item.jumlah)} strong />
          {item.status === 'ditolak' && item.alasanTolak && (
            <DetailLine icon={NoteIcon} label="Alasan Ditolak" value={item.alasanTolak} />
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-navy mb-3">
            <ImageIcon className="h-4 w-4 text-navy-light" />
            Bukti Pembayaran
          </p>
          {!buktiUrl ? (
            <p className="text-sm text-navy/40">Tidak ada bukti yang dilampirkan untuk pembayaran ini.</p>
          ) : isPdf ? (
            <a
              href={buktiUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-navy-light hover:underline"
            >
              Buka file PDF bukti pembayaran
            </a>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="rounded-xl overflow-hidden border border-emerald-100 bg-white"
              >
                <img src={buktiUrl} alt="Bukti pembayaran" className="h-28 w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="print:hidden rounded-xl bg-emerald-100/60 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 px-4 text-left text-xs text-navy/60"
              >
                <ZoomIcon className="h-4 w-4 text-navy-light shrink-0" />
                Klik untuk memperbesar gambar bukti pembayaran
              </button>
            </div>
          )}
        </div>

        <div className="print:hidden flex justify-end gap-3 pt-5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-navy/20 bg-white text-navy hover:bg-navy/5 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak Bukti
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-navy hover:bg-navy/90 text-white text-sm font-bold px-7 py-2.5 rounded-full shadow-md transition-colors"
          >
            Tutup
          </button>
        </div>
      </ModalShell>

      {zoom && buktiUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/75 flex items-center justify-center p-4 cursor-zoom-out print:hidden"
          onClick={() => setZoom(false)}
        >
          <img src={buktiUrl} alt="Bukti pembayaran" className="max-h-[90vh] max-w-full rounded-xl shadow-2xl" />
        </div>
      )}
    </>
  )
}

function DetailLine({ icon: Icon, label, value, sub, strong }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-3 items-start py-2.5">
      <span className="flex items-center gap-2.5 text-sm text-navy/60">
        <Icon className="h-4 w-4 text-navy-light shrink-0" />
        {label}
      </span>
      <div>
        <p className={`text-sm text-navy ${strong ? 'font-extrabold text-base' : 'font-semibold'}`}>{value}</p>
        {sub && <p className="text-xs text-navy/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function CloseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function CheckBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  )
}

function ImageIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 16-5-5-8 8" />
    </svg>
  )
}

function ZoomIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
    </svg>
  )
}

function PrinterIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="7" rx="1" />
    </svg>
  )
}
