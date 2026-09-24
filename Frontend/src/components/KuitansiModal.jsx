import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { terbilangRupiah } from '../lib/terbilang'
import { ModalShell } from './GreenModal'

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

function parseTanggal(value) {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function nomorKuitansi(pembayaran) {
  const tahun = String(pembayaran.tanggal_bayar).slice(0, 4)
  return `KWT/${tahun}/${String(pembayaran.id).padStart(5, '0')}`
}

export default function KuitansiModal({ pembayaran, sekolah, penandatangan, autoPrint = false, onClose }) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await api.downloadKuitansi(pembayaran.id, nomorKuitansi(pembayaran))
    } catch (err) {
      window.alert(err.message)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    if (!autoPrint) return
    const timer = setTimeout(() => window.print(), 400)
    return () => clearTimeout(timer)
  }, [autoPrint])

  const tagihan = pembayaran.tagihan
  const siswa = tagihan?.siswa
  const tanggal = parseTanggal(pembayaran.tanggal_bayar)
  const tanggalPanjang = tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalTerbayar = (tagihan?.pembayaran || []).reduce((sum, p) => sum + Number(p.jumlah), 0)
  const sisa = Math.max(Number(tagihan?.jumlah || 0) - totalTerbayar, 0)
  const alamat = [sekolah?.alamat, sekolah?.kelurahan, sekolah?.kecamatan, sekolah?.kabupaten_kota, sekolah?.provinsi]
    .filter(Boolean)
    .join(', ')
  const kontak = [sekolah?.telepon && `Telp. ${sekolah.telepon}`, sekolah?.email].filter(Boolean).join(' · ')

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-extrabold text-navy">Kuitansi Pembayaran</h2>
        <p className="text-xs text-navy/50 mt-0.5">{nomorKuitansi(pembayaran)}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="print:hidden text-navy/40 hover:text-navy hover:bg-white/70 rounded-full p-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )

  return (
    <ModalShell header={header} cardClassName="print-area" onClose={onClose} dismissOnBackdrop size="lg">
      <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-navy">
        <div className="text-center border-b-2 border-navy/80 pb-3 mb-4">
          <p className="text-base font-extrabold uppercase tracking-wide">{sekolah?.nama_sekolah || 'Sekolah'}</p>
          {alamat && <p className="text-[11px] text-navy/60 mt-0.5">{alamat}</p>}
          {kontak && <p className="text-[11px] text-navy/60">{kontak}</p>}
        </div>

        <div className="text-center mb-4">
          <p className="font-extrabold tracking-widest text-sm">KUITANSI PEMBAYARAN</p>
          <p className="text-xs text-navy/50">No. {nomorKuitansi(pembayaran)}</p>
        </div>

        <dl className="text-sm space-y-2.5">
          <Line label="Telah terima dari">
            <span className="font-semibold">{siswa?.nama || '-'}</span>
            <span className="text-navy/60">
              {[siswa?.nisn && `NISN ${siswa.nisn}`, siswa?.kelas?.nama_kelas && `Kelas ${siswa.kelas.nama_kelas}`]
                .filter(Boolean)
                .map((t) => ` · ${t}`)
                .join('')}
            </span>
          </Line>
          <Line label="Uang sejumlah">
            <span className="italic font-semibold">{terbilangRupiah(pembayaran.jumlah)}</span>
          </Line>
          <Line label="Untuk pembayaran">
            <span className="font-semibold">{tagihan?.judul || '-'}</span>
            {tagihan?.periode && <span className="text-navy/60"> ({tagihan.periode})</span>}
          </Line>
          <Line label="Metode">{METODE_LABEL[pembayaran.metode] || pembayaran.metode || '-'}</Line>
        </dl>

        <div className="mt-5 grid grid-cols-2 gap-4 items-end">
          <div className="text-xs space-y-1 text-navy/70">
            <p className="flex justify-between gap-3">
              <span>Nominal tagihan</span>
              <span className="font-semibold text-navy">{formatRupiah(tagihan?.jumlah)}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span>Total terbayar</span>
              <span className="font-semibold text-navy">{formatRupiah(totalTerbayar)}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span>Sisa tagihan</span>
              <span className={`font-bold ${sisa === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {sisa === 0 ? 'LUNAS' : formatRupiah(sisa)}
              </span>
            </p>
          </div>
          <div className="rounded-xl border-2 border-navy/80 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-navy/50">Jumlah dibayar</p>
            <p className="text-xl font-extrabold">{formatRupiah(pembayaran.jumlah)}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="text-center text-sm min-w-44">
            <p className="text-navy/70">
              {sekolah?.kabupaten_kota ? `${sekolah.kabupaten_kota}, ` : ''}
              {tanggalPanjang}
            </p>
            <p className="font-semibold mt-0.5">Bendahara</p>
            <div className="h-16" />
            <p className="font-bold border-t border-navy/40 pt-1">{penandatangan || '.....................'}</p>
          </div>
        </div>
      </div>

      <div className="print:hidden flex justify-end gap-3 pt-5 flex-wrap">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 border border-navy-light bg-white text-navy-light hover:bg-emerald-50 text-sm font-bold px-5 py-2.5 rounded-full transition-colors disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v12M7 11l5 5 5-5" />
            <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
          </svg>
          {downloading ? 'Mengunduh...' : 'Unduh PDF'}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-md transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="7" rx="1" />
          </svg>
          Cetak Kuitansi
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border border-navy/20 bg-white text-navy hover:bg-navy/5 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  )
}

function Line({ label, children }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2">
      <dt className="text-navy/60">{label}</dt>
      <dd>: {children}</dd>
    </div>
  )
}
