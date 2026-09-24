import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ModalShell } from './GreenModal'

function formatRupiah(value) {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`
}

export function instruksiPembayaran({ nama, kelas, bank, nomor, tunggakan }) {
  return [
    `Yth. Orang tua/wali ${nama}${kelas ? ` (${kelas})` : ''},`,
    `Pembayaran tagihan sekolah dapat ditransfer ke Virtual Account${bank ? ` ${bank}` : ''}:`,
    nomor,
    tunggakan > 0 ? `Tunggakan saat ini: ${formatRupiah(tunggakan)}.` : 'Saat ini tidak ada tunggakan.',
  ].join('\n')
}

export default function VirtualAccountDetailModal({ item, bank, onClose }) {
  const [tagihan, setTagihan] = useState(null)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    api
      .listTagihan({ siswa_id: item.id, status: 'belum_lunas', per_page: 50 })
      .then((r) => setTagihan(r.data ?? r))
      .catch(() => setTagihan([]))
  }, [item.id])

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    })
  }

  const instruksi = instruksiPembayaran({
    nama: item.nama,
    kelas: item.kelas,
    bank,
    nomor: item.nomor_va,
    tunggakan: item.tunggakan,
  })

  return (
    <ModalShell title="Detail Virtual Account" subtitle={item.nama} onClose={onClose} dismissOnBackdrop>
      <div className="bg-white/80 rounded-2xl border border-emerald-100 px-4 py-2 divide-y divide-emerald-100">
        <Line label="NISN" value={item.nisn || item.nis || '-'} />
        <Line label="Kelas" value={item.kelas || '-'} />
        <Line label="Bank" value={bank || '-'} />
        <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="text-navy/60">Nomor VA</span>
          <span className="flex items-center gap-2">
            <span className="font-mono font-semibold text-navy">{item.nomor_va}</span>
            <button
              type="button"
              onClick={() => copy(item.nomor_va, 'va')}
              className="text-xs font-semibold text-navy-light hover:underline"
            >
              {copied === 'va' ? 'Tersalin' : 'Salin'}
            </button>
          </span>
        </div>
        <Line label="Tunggakan" value={formatRupiah(item.tunggakan)} strong />
      </div>

      <p className="text-xs font-bold text-navy/50 uppercase tracking-wide mt-4 mb-2">Tagihan Belum Lunas</p>
      {tagihan === null ? (
        <p className="text-sm text-navy/40">Memuat...</p>
      ) : tagihan.length === 0 ? (
        <p className="text-sm text-navy/40">Tidak ada tagihan yang belum lunas.</p>
      ) : (
        <ul className="space-y-1.5 max-h-40 overflow-y-auto">
          {tagihan.map((t) => {
            const terbayar = (t.pembayaran || []).reduce((sum, p) => sum + Number(p.jumlah), 0)
            return (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm bg-white/70 rounded-xl px-3 py-2">
                <span className="text-navy min-w-0 truncate">{t.judul}</span>
                <span className="font-semibold text-navy shrink-0">{formatRupiah(Number(t.jumlah) - terbayar)}</span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex justify-end gap-3 pt-5 flex-wrap">
        <button
          type="button"
          onClick={() => copy(instruksi, 'ins')}
          className="border border-navy-light bg-white text-navy-light hover:bg-emerald-50 text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
        >
          {copied === 'ins' ? 'Instruksi tersalin' : 'Salin Instruksi Pembayaran'}
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
  )
}

function Line({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-navy/60">{label}</span>
      <span className={`text-navy ${strong ? 'font-extrabold' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
