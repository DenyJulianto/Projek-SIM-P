import { HARI_PENDEK, KATEGORI_STYLE, awalMinggu, fromIso, namaBulan, toIso } from './kalenderKonstanta'

const cover = (e, iso) => e.tanggal_mulai <= iso && e.tanggal_selesai >= iso

function Chip({ e, onClick, kecil = true }) {
  const s = KATEGORI_STYLE[e.kategori] ?? KATEGORI_STYLE.lainnya
  const batal = e.status === 'dibatalkan'
  return (
    <button
      onClick={(ev) => {
        ev.stopPropagation()
        onClick(e)
      }}
      title={`${e.judul} — ${e.kategori_label}${e.status_label && e.status_label !== '-' ? ` (${e.status_label})` : ''}`}
      className={`w-full text-left rounded px-1.5 ${kecil ? 'py-0.5 text-[10px]' : 'py-1 text-xs'} truncate ${s.chip} ${batal ? 'line-through opacity-60' : ''} ${e.baca_saja ? 'border border-dashed border-current/30' : ''}`}
    >
      {e.waktu_mulai ? `${e.waktu_mulai} ` : ''}
      {e.judul}
    </button>
  )
}

export function MonthView({ tahun, bulan, entri, hariEfektif, onEntri, onTanggal }) {
  const first = new Date(tahun, bulan, 1)
  const start = awalMinggu(first)
  const hariIni = toIso(new Date())
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  const barisTerakhir = cells.slice(35).some((d) => d.getMonth() === bulan) ? 6 : 5

  return (
    <div className="border border-navy/10 rounded-2xl overflow-hidden bg-white">
      <div className="grid grid-cols-7 bg-navy/5 text-[11px] font-semibold text-navy/60 uppercase">
        {HARI_PENDEK.map((h) => (
          <div key={h} className="px-2 py-2 text-center">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.slice(0, barisTerakhir * 7).map((d) => {
          const iso = toIso(d)
          const luar = d.getMonth() !== bulan
          const akhirPekan = d.getDay() === 0 || d.getDay() === 6
          const jenis = hariEfektif[iso]
          const items = entri.filter((e) => cover(e, iso))
          const tint = jenis === 'libur' && !akhirPekan ? 'bg-red-50' : jenis === 'ujian' ? 'bg-amber-50' : akhirPekan ? 'bg-navy/[0.03]' : ''
          return (
            <div key={iso} onClick={() => onTanggal(iso)} className={`min-h-24 border-t border-l border-navy/5 p-1 cursor-pointer hover:bg-navy/[0.04] ${tint} ${luar ? 'opacity-40' : ''}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full ${iso === hariIni ? 'bg-navy text-white' : akhirPekan || jenis === 'libur' ? 'text-red-600' : 'text-navy/70'}`}>{d.getDate()}</span>
                {jenis === 'efektif' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Hari efektif" />}
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((e) => (
                  <Chip key={e.key} e={e} onClick={onEntri} />
                ))}
                {items.length > 3 && <p className="text-[10px] text-navy/50 px-1">+{items.length - 3} lagi</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function WeekView({ awal, entri, hariEfektif, onEntri, onTanggal }) {
  const hariIni = toIso(new Date())
  const hari = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(awal)
    d.setDate(awal.getDate() + i)
    return d
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {hari.map((d, i) => {
        const iso = toIso(d)
        const items = entri.filter((e) => cover(e, iso))
        const jenis = hariEfektif[iso]
        const akhirPekan = d.getDay() === 0 || d.getDay() === 6
        return (
          <div key={iso} onClick={() => onTanggal(iso)} className={`border rounded-xl p-2 min-h-40 cursor-pointer hover:border-navy/30 ${iso === hariIni ? 'border-navy' : 'border-navy/10'} ${jenis === 'libur' && !akhirPekan ? 'bg-red-50' : jenis === 'ujian' ? 'bg-amber-50' : akhirPekan ? 'bg-navy/[0.03]' : 'bg-white'}`}>
            <p className="text-[11px] font-semibold text-navy/50 uppercase">{HARI_PENDEK[i]}</p>
            <p className={`text-lg font-extrabold mb-1 ${akhirPekan || jenis === 'libur' ? 'text-red-600' : 'text-navy'}`}>{d.getDate()}</p>
            {jenis && <p className="text-[10px] text-navy/40 mb-1">{jenis === 'efektif' ? 'Hari efektif' : jenis === 'libur' ? 'Libur' : jenis === 'ujian' ? 'Ujian' : jenis === 'kegiatan_sekolah' ? 'Kegiatan sekolah' : 'Lainnya'}</p>}
            <div className="space-y-1">
              {items.map((e) => (
                <Chip key={e.key} e={e} onClick={onEntri} kecil={false} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AgendaView({ entri, onEntri }) {
  if (entri.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Tidak ada agenda pada rentang ini.</p>

  const perBulan = entri.reduce((acc, e) => {
    const k = e.tanggal_mulai.slice(0, 7)
    ;(acc[k] ||= []).push(e)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(perBulan).map(([k, items]) => {
        const [y, m] = k.split('-').map(Number)
        return (
          <div key={k}>
            <h3 className="text-sm font-bold text-navy mb-2">
              {namaBulan(m - 1)} {y}
            </h3>
            <div className="bg-white border border-navy/10 rounded-2xl divide-y divide-navy/5">
              {items.map((e) => {
                const s = KATEGORI_STYLE[e.kategori] ?? KATEGORI_STYLE.lainnya
                const mulai = fromIso(e.tanggal_mulai)
                return (
                  <button key={e.key} onClick={() => onEntri(e)} className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-navy/[0.03]">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-lg font-extrabold text-navy leading-none">{mulai.getDate()}</p>
                      <p className="text-[10px] uppercase text-navy/40">{HARI_PENDEK[(mulai.getDay() + 6) % 7]}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold text-navy ${e.status === 'dibatalkan' ? 'line-through opacity-60' : ''}`}>{e.judul}</p>
                      <p className="text-xs text-navy/50">
                        {e.tanggal_selesai !== e.tanggal_mulai && `s.d. ${fromIso(e.tanggal_selesai).getDate()} ${namaBulan(fromIso(e.tanggal_selesai).getMonth())} · `}
                        {e.waktu_mulai && `${e.waktu_mulai}${e.waktu_selesai ? `–${e.waktu_selesai}` : ''} · `}
                        {[e.lokasi, e.penanggung_jawab && `PJ: ${e.penanggung_jawab}`].filter(Boolean).join(' · ') || e.sumber_label}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.chip}`}>{e.kategori_label}</span>
                      {e.status && e.status !== 'direncanakan' && <span className="text-[10px] text-navy/50">{e.status_label}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
