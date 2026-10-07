import { formatTanggalPoin, nadaPoin } from '../lib/poinKedisiplinan'

/**
 * Ringkasan & riwayat buku poin kedisiplinan siswa (mulai 100; berkurang
 * karena pelanggaran, bertambah karena apresiasi, selalu 0–100). Dipakai
 * Kesiswaan (dengan tombol aksi per baris) serta siswa dan orang tua
 * (baca-saja). `data` = ringkasan dari server: { poin_awal, sisa_poin,
 * total_pengurangan, total_penambahan, peringatan, riwayat[], kategori }.
 */

const KATEGORI_TONE = {
  ringan: 'bg-slate-100 text-slate-600',
  sedang: 'bg-amber-100 text-amber-700',
  berat: 'bg-red-100 text-red-600',
  sangat_berat: 'bg-red-600 text-white',
  prestasi: 'bg-emerald-100 text-emerald-700',
  perilaku_terpuji: 'bg-teal-100 text-teal-700',
  penyesuaian: 'bg-navy/5 text-navy/60',
}

export function RingkasanPoin({ data }) {
  const awal = data.poin_awal ?? 100
  const sisa = data.sisa_poin ?? awal
  const nada = nadaPoin(sisa, awal)

  return (
    <div className="space-y-3">
      {data.peringatan && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span aria-hidden="true" className="font-extrabold">!</span>
          <p>{data.peringatan}</p>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-navy/50">Poin Awal</p>
            <p className="text-2xl font-extrabold text-navy mt-1">{awal}</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">Pengurangan</p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{data.total_pengurangan > 0 ? `−${data.total_pengurangan}` : 0}</p>
            <p className="text-[11px] text-navy/40">pelanggaran</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">Penambahan</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{data.total_penambahan > 0 ? `+${data.total_penambahan}` : 0}</p>
            <p className="text-[11px] text-navy/40">apresiasi</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">Sisa Poin</p>
            <p className={`text-3xl font-extrabold mt-1 ${nada.teks}`}>{sisa}</p>
            <p className={`text-[11px] font-semibold ${nada.teks}`}>{nada.label}</p>
          </div>
        </div>
        <div
          className="mt-4 h-2.5 rounded-full bg-navy/5 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={awal}
          aria-valuenow={sisa}
        >
          <div className={`h-full rounded-full ${nada.bar} transition-all`} style={{ width: `${Math.max(0, Math.min(100, (sisa / awal) * 100))}%` }} />
        </div>
        <p className="text-[11px] text-navy/40 mt-2">
          Poin tidak bisa melebihi {awal}: apresiasi memulihkan poin yang pernah dikurangi.
        </p>
      </div>
    </div>
  )
}

/** aksi(item) → elemen tombol (khusus Kesiswaan); tanpa aksi = baca-saja. */
export function DaftarRiwayatPoin({ data, aksi, kosong = 'Belum ada catatan poin. Poin masih utuh — pertahankan!' }) {
  if (data.riwayat.length === 0) {
    return <p className="bg-white rounded-2xl border border-navy/10 px-4 py-10 text-center text-sm text-navy/40">{kosong}</p>
  }

  return (
    <ol className="space-y-3">
      {data.riwayat.map((r) => {
        const tambah = r.perubahan > 0
        return (
          <li key={r.id} className="bg-white rounded-2xl border border-navy/10 p-4 flex items-start gap-4">
            <div
              className={`shrink-0 h-12 w-12 rounded-xl flex flex-col items-center justify-center leading-none ${
                tambah ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              <span className="text-lg font-extrabold">
                {tambah ? '+' : '−'}
                {r.poin}
              </span>
              <span className="text-[9px] font-semibold uppercase mt-0.5">poin</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">{r.keterangan}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-navy/50">
                <span>{formatTanggalPoin(r.tanggal)}</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full ${KATEGORI_TONE[r.kategori] || KATEGORI_TONE.penyesuaian}`}>
                  {r.kategori_label}
                </span>
                {r.dari_pengajuan_bk && <span className="font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">Pengajuan BK</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] text-navy/40">Sisa poin</p>
              <p className={`text-lg font-extrabold ${nadaPoin(r.sisa_setelah, data.poin_awal).teks}`}>{r.sisa_setelah}</p>
              {aksi && <div className="mt-1.5 flex justify-end gap-1.5">{aksi(r)}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Pedoman poin per kategori (dari server) — ditampilkan ke siswa & orang tua. */
export function PedomanPoin({ kategori }) {
  if (!kategori) return null
  const daftar = Object.entries(kategori)

  return (
    <details className="bg-white rounded-2xl border border-navy/10 p-4 group">
      <summary className="cursor-pointer text-sm font-bold text-navy list-none flex items-center justify-between">
        Pedoman Poin Kedisiplinan
        <span className="text-xs font-semibold text-navy/40 group-open:hidden">Lihat</span>
        <span className="text-xs font-semibold text-navy/40 hidden group-open:inline">Tutup</span>
      </summary>
      <ul className="mt-3 space-y-2">
        {daftar.map(([key, k]) => (
          <li key={key} className="flex gap-3 text-sm">
            <span
              className={`shrink-0 w-20 text-center font-bold rounded-lg py-0.5 ${
                k.arah > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {k.arah > 0 ? '+' : '−'}
              {k.min === k.max ? k.min : `${k.min}–${k.max}`}
            </span>
            <span className="text-navy/70">
              <span className="font-semibold text-navy">{k.label}:</span> {k.contoh}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}
