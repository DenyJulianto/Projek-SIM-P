import { formatSel } from './laporanFormat'

/** Render seragam untuk semua jenis Laporan Akademik: kartu ringkasan, catatan, dan tabel. */

function warnaPersen(p) {
  return p >= 80 ? 'bg-emerald-500' : p >= 60 ? 'bg-amber-500' : 'bg-red-500'
}

function Sel({ kolom, nilai }) {
  if (kolom.tipe === 'persen' && nilai !== null && nilai !== undefined) {
    return (
      <div className="flex items-center gap-2 justify-end min-w-24">
        <div className="w-14 h-1.5 bg-navy/10 rounded-full overflow-hidden">
          <div className={`h-full ${warnaPersen(nilai)}`} style={{ width: `${Math.min(100, nilai)}%` }} />
        </div>
        <span className="tabular-nums w-9 text-right">{nilai}%</span>
      </div>
    )
  }
  return <>{formatSel(kolom, nilai)}</>
}

const rata = (kolom) => (['angka', 'desimal', 'persen'].includes(kolom.tipe) ? 'text-right' : 'text-left')

export default function LaporanTampilan({ laporan, cari = '', aksiBaris }) {
  const kata = cari.trim().toLowerCase()
  return (
    <div className="space-y-5">
      {laporan.ringkasan.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {laporan.ringkasan.map((s) => (
            <div key={s.label} className="bg-white border border-navy/10 rounded-2xl p-4">
              <p className="text-[11px] font-semibold uppercase text-navy/50">{s.label}</p>
              <p className="text-2xl font-extrabold text-navy mt-1">
                {s.nilai === null || s.nilai === undefined ? '-' : Number(s.nilai).toLocaleString('id-ID')}
                {s.keterangan?.startsWith('%') && s.nilai !== null && s.nilai !== undefined && <span className="text-base">%</span>}
              </p>
              {s.keterangan && s.keterangan !== '%' && <p className="text-[11px] text-navy/40 mt-0.5">{s.keterangan.startsWith('%') ? s.keterangan.slice(1).trim() : s.keterangan}</p>}
            </div>
          ))}
        </div>
      )}

      {laporan.catatan.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 space-y-1">
          {laporan.catatan.map((n) => (
            <p key={n} className="text-xs text-amber-800">
              {n}
            </p>
          ))}
        </div>
      )}

      {laporan.tabel.map((t) => {
        const baris = kata ? t.baris.filter((b) => t.kolom.some((k) => String(b[k.key] ?? '').toLowerCase().includes(kata))) : t.baris
        const punyaAksi = aksiBaris && t.id === aksiBaris.tabel
        return (
          <section key={t.id}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <h3 className="text-sm font-bold text-navy">{t.judul}</h3>
              <span className="text-[11px] text-navy/40 shrink-0">{baris.length} baris</span>
            </div>
            {t.keterangan && <p className="text-xs text-navy/50 mb-1.5">{t.keterangan}</p>}
            <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy/5 text-[11px] uppercase text-navy/60">
                    {t.kolom.map((k) => (
                      <th key={k.key} className={`px-3 py-2 font-semibold whitespace-nowrap ${rata(k)}`}>
                        {k.label}
                      </th>
                    ))}
                    {punyaAksi && <th className="px-3 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {baris.length === 0 && (
                    <tr>
                      <td colSpan={t.kolom.length + 1} className="px-3 py-6 text-center text-navy/40 text-xs">
                        Tidak ada data.
                      </td>
                    </tr>
                  )}
                  {baris.map((b, i) => (
                    <tr key={i} className="hover:bg-navy/[0.02]">
                      {t.kolom.map((k) => (
                        <td key={k.key} className={`px-3 py-2 text-navy/80 ${rata(k)}`}>
                          <Sel kolom={k} nilai={b[k.key]} />
                        </td>
                      ))}
                      {punyaAksi && <td className="px-3 py-2 text-right whitespace-nowrap">{aksiBaris.render(b)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
