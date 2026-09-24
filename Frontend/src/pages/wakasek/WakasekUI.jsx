import { Ikon } from '../../components/DashIcons'
import { Field } from '../../components/PpdbUI'
import { selectClass } from '../../components/ppdbKonstanta'

/** Bingkai halaman: tombol kembali, judul, dan deskripsi singkat. */
export function Halaman({ judul, deskripsi, onBack, children }) {
  return (
    <div>
      <div className="mb-5">
        {onBack && (
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-navy">{judul}</h1>
        {deskripsi && <p className="text-sm text-navy/50 mt-1 max-w-2xl">{deskripsi}</p>}
      </div>
      {children}
    </div>
  )
}

/** Halaman induk berisi kartu-kartu menu turunan (mis. Kurikulum → Struktur Kurikulum, Mata Pelajaran, …). */
export function HubMenu({ judul, deskripsi, item, onBuka, onBack }) {
  return (
    <Halaman judul={judul} deskripsi={deskripsi} onBack={onBack}>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {item.map((i) => (
          <button key={i.key} onClick={() => onBuka(i.key)} className="text-left rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 hover:shadow-md transition-shadow flex gap-4 items-start">
            <span className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Ikon nama={i.icon} className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-navy">{i.label}</span>
              <span className="block text-xs text-navy/50 mt-0.5">{i.deskripsi}</span>
            </span>
            <Ikon nama="right" className="h-4 w-4 text-navy/30 mt-1 shrink-0" />
          </button>
        ))}
      </div>
    </Halaman>
  )
}

const iso = (d) => d.toISOString().slice(0, 10)

/** Pilihan periode cepat (bulan ini, bulan lalu, 30 hari, semester berjalan ≈ 6 bulan) ditambah tanggal manual. */
export function PeriodeFilter({ nilai, onChange }) {
  const sekarang = new Date()
  const preset = {
    'bulan-ini': [iso(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)), iso(sekarang)],
    'bulan-lalu': [iso(new Date(sekarang.getFullYear(), sekarang.getMonth() - 1, 1)), iso(new Date(sekarang.getFullYear(), sekarang.getMonth(), 0))],
    '30-hari': [iso(new Date(sekarang.getTime() - 29 * 86400000)), iso(sekarang)],
    '6-bulan': [iso(new Date(sekarang.getFullYear(), sekarang.getMonth() - 5, 1)), iso(sekarang)],
  }
  const label = { 'bulan-ini': 'Bulan ini', 'bulan-lalu': 'Bulan lalu', '30-hari': '30 hari terakhir', '6-bulan': '6 bulan terakhir' }
  return (
    <div className="flex items-end gap-3 flex-wrap">
      <Field label="Periode cepat">
        <select value="" onChange={(e) => e.target.value && onChange({ dari: preset[e.target.value][0], sampai: preset[e.target.value][1] })} className={selectClass}>
          <option value="">Pilih…</option>
          {Object.keys(preset).map((k) => (
            <option key={k} value={k}>
              {label[k]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Dari">
        <input type="date" value={nilai.dari} onChange={(e) => onChange({ ...nilai, dari: e.target.value })} className={selectClass} />
      </Field>
      <Field label="Sampai">
        <input type="date" value={nilai.sampai} onChange={(e) => onChange({ ...nilai, sampai: e.target.value })} className={selectClass} />
      </Field>
    </div>
  )
}

/** Batang persentase kecil (hijau ≥ 90, kuning ≥ 75, merah di bawahnya); kosong bila belum ada data. */
export function Persen({ nilai }) {
  if (nilai === null || nilai === undefined) return <span className="text-navy/30">-</span>
  const warna = nilai >= 90 ? 'bg-emerald-500' : nilai >= 75 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <span className="inline-flex items-center gap-2 min-w-24">
      <span className="w-14 h-1.5 bg-navy/10 rounded-full overflow-hidden">
        <span className={`block h-full ${warna}`} style={{ width: `${Math.min(100, nilai)}%` }} />
      </span>
      <span className="tabular-nums text-xs font-semibold">{nilai}%</span>
    </span>
  )
}
