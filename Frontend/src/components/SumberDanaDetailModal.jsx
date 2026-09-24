import { kategoriLabel } from '../lib/sumberDanaKategori'
import { ModalShell } from './GreenModal'

function formatRupiah(value) {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`
}

export default function SumberDanaDetailModal({ item, persen, onClose, onEdit }) {
  return (
    <ModalShell title="Detail Sumber Dana" subtitle={item.nama} onClose={onClose} dismissOnBackdrop>
      <div className="bg-white/80 rounded-2xl border border-emerald-100 px-4 py-2 divide-y divide-emerald-100">
        <Line label="Tahun Anggaran" value={item.tahun_ajaran} />
        <Line label="Kategori" value={kategoriLabel(item.kategori)} />
        <Line label="Jumlah" value={formatRupiah(item.jumlah)} strong />
        <Line label="Porsi dari total" value={`${persen}%`} />
      </div>

      <p className="text-xs font-bold text-navy/50 uppercase tracking-wide mt-4 mb-2">Keterangan</p>
      <p className="text-sm text-navy/70 bg-white/70 rounded-xl px-3 py-2.5 whitespace-pre-line">
        {item.keterangan || 'Tidak ada keterangan.'}
      </p>

      <div className="flex justify-end gap-3 pt-5">
        <button
          type="button"
          onClick={onEdit}
          className="border border-navy-light bg-white text-navy-light hover:bg-emerald-50 text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
        >
          Edit
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
