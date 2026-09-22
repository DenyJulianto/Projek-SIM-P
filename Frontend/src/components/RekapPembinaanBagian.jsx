import { useEffect, useState } from 'react'
import { BASE_URL, api } from '../lib/api'
import LaporanPrint from './LaporanPrint'
import LaporanTampilan from './LaporanTampilan'
import { Badge, Btn, Field, Kartu, Kosong, Pesan } from './PpdbUI'
import { TONE_STATUS_TL, TONE_TINGKAT_PELANGGARAN, selectClass, tgl } from './ppdbKonstanta'

const TIPE = {
  pelanggaran: { label: 'Pelanggaran', titik: 'bg-red-500', tone: 'merah' },
  prestasi: { label: 'Prestasi', titik: 'bg-emerald-500', tone: 'hijau' },
  tindak_lanjut: { label: 'Tindak lanjut', titik: 'bg-sky-500', tone: 'biru' },
}

// ------------------------------------------------------------ pemilih siswa

/** Cari dan pilih siswa (nama/NIS/NISN), dapat dipersempit menurut tahun ajaran, tingkat, dan rombel. */
export function PemilihSiswaRekap({ opsi, filter, onPilih }) {
  const [q, setQ] = useState({ search: '', tingkat: '', kelas_id: '' })
  const [hasil, setHasil] = useState(null)
  const [error, setError] = useState('')

  const ta = opsi.tahun_ajaran.find((t) => String(t.id) === filter.tahun_ajaran_id)
  const rombel = opsi.kelas.filter((k) => (!q.tingkat || k.tingkat === q.tingkat) && (!ta || k.tahun_ajaran_id === ta.id || k.tahun_ajaran === ta.nama))

  useEffect(() => {
    const p = Object.fromEntries(Object.entries({ ...q, tahun_ajaran_id: filter.tahun_ajaran_id }).filter(([, v]) => v !== ''))
    const t = setTimeout(() => {
      api
        .rpSiswa(p)
        .then((r) => (setHasil(r), setError('')))
        .catch((e) => setError(e.message))
    }, 300)
    return () => clearTimeout(t)
  }, [q, filter.tahun_ajaran_id])

  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-4">
      <div className="grid sm:grid-cols-4 gap-3">
        <Field label="Cari nama / NIS / NISN" className="sm:col-span-2">
          <input value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value })} placeholder="Ketik nama, NIS, atau NISN siswa…" className={`${selectClass} w-full`} autoFocus />
        </Field>
        <Field label="Kelas (tingkat)">
          <select value={q.tingkat} onChange={(e) => setQ({ ...q, tingkat: e.target.value, kelas_id: '' })} className={`${selectClass} w-full`}>
            <option value="">Semua</option>
            {opsi.tingkat.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Rombel">
          <select value={q.kelas_id} onChange={(e) => setQ({ ...q, kelas_id: e.target.value })} className={`${selectClass} w-full`}>
            <option value="">Semua</option>
            {rombel.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Pesan error={error} />
      <div className="mt-3 border border-navy/10 rounded-xl overflow-hidden">
        {!hasil ? (
          <Kosong>Memuat…</Kosong>
        ) : hasil.length === 0 ? (
          <Kosong>Tidak ada siswa yang cocok.</Kosong>
        ) : (
          <ul className="divide-y divide-navy/5 max-h-72 overflow-y-auto">
            {hasil.map((s) => (
              <li key={s.id}>
                <button onClick={() => onPilih(s)} className="w-full text-left px-4 py-2.5 hover:bg-navy/5 flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-navy truncate">{s.nama}</span>
                    <span className="block text-[11px] text-navy/50">
                      NIS {s.nis} · NISN {s.nisn || '-'} · {s.rombel || 'Tanpa kelas'}
                    </span>
                  </span>
                  {s.pelanggaran_aktif > 0 && <Badge tone="kuning">{s.pelanggaran_aktif} pelanggaran aktif</Badge>}
                  {s.status !== 'aktif' && <Badge>{s.status}</Badge>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasil?.length === 30 && <p className="text-[11px] text-navy/40 mt-1">Menampilkan 30 siswa pertama — persempit pencarian untuk hasil lain.</p>}
    </div>
  )
}

// ----------------------------------------------------------------- identitas

export function IdentitasSiswa({ identitas: i, onGanti }) {
  const item = [
    ['NIS', i.nis],
    ['NISN', i.nisn],
    ['Kelas', i.kelas],
    ['Rombel', i.rombel],
    ['Tahun ajaran', i.tahun_ajaran],
    ['Wali kelas', i.wali_kelas],
  ]
  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-4 flex gap-4 items-center flex-wrap">
      {i.foto_url ? (
        <img src={`${BASE_URL}${i.foto_url}`} alt={i.nama} className="h-20 w-20 rounded-2xl object-cover bg-navy/5" />
      ) : (
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-sky-100 text-navy font-extrabold text-2xl flex items-center justify-center">
          {i.nama
            .split(' ')
            .slice(0, 2)
            .map((k) => k[0])
            .join('')
            .toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-64">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-extrabold text-navy">{i.nama}</h2>
          <Badge tone={i.status === 'aktif' ? 'hijau' : 'abu'}>{i.status ? i.status[0].toUpperCase() + i.status.slice(1) : '-'}</Badge>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 mt-2">
          {item.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] uppercase font-semibold text-navy/40">{k}</dt>
              <dd className="text-sm text-navy">{v || '-'}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Btn onClick={onGanti}>Ganti Siswa</Btn>
    </div>
  )
}

// ----------------------------------------------------------------- ringkasan

/** Pelanggaran dan prestasi ditampilkan sebagai dua aspek terpisah; sengaja tidak ada skor gabungan. */
export function RingkasanPembinaan({ r }) {
  const maks = Math.max(1, ...r.per_tingkat_pelanggaran.map((t) => t.jumlah))
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kartu tone="merah" label="Total pelanggaran" nilai={r.total_pelanggaran} sub={r.pakai_poin ? `Total poin: ${r.total_poin}` : undefined} />
        <Kartu tone="hijau" label="Total prestasi" nilai={r.total_prestasi} sub="Yang sudah terverifikasi" />
        <Kartu tone="biru" label="Pembinaan / tindak lanjut" nilai={r.total_tindak_lanjut} sub={r.tindak_lanjut_terlambat > 0 ? `${r.tindak_lanjut_terlambat} melewati jadwal` : 'Tidak termasuk yang dibatalkan'} />
        <Kartu tone="oranye" label="Pelanggaran aktif" nilai={r.pelanggaran_aktif} sub="Belum berstatus selesai" />
      </div>
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="bg-white border border-navy/10 rounded-2xl p-4">
          <p className="text-xs font-bold text-navy mb-2">Prestasi terbaru</p>
          {r.prestasi_terbaru ? (
            <>
              <p className="text-sm font-semibold text-navy">{r.prestasi_terbaru.judul}</p>
              <p className="text-[11px] text-navy/50">
                {tgl(r.prestasi_terbaru.tanggal)} · Tingkat {r.prestasi_terbaru.tingkat}
              </p>
            </>
          ) : (
            <p className="text-xs text-navy/40">Belum ada prestasi terverifikasi.</p>
          )}
        </div>
        <div className="bg-white border border-navy/10 rounded-2xl p-4">
          <p className="text-xs font-bold text-navy mb-2">Tingkat pelanggaran</p>
          <div className="space-y-1.5">
            {r.per_tingkat_pelanggaran.map((t) => (
              <div key={t.key} className="flex items-center gap-2 text-xs">
                <span className="w-14 text-navy/60">{t.label}</span>
                <div className="flex-1 h-2 bg-navy/10 rounded-full overflow-hidden">
                  <div className={`h-full ${t.key === 'berat' ? 'bg-red-500' : t.key === 'sedang' ? 'bg-amber-500' : 'bg-navy/40'}`} style={{ width: `${(t.jumlah / maks) * 100}%` }} />
                </div>
                <span className="w-5 text-right tabular-nums font-semibold text-navy">{t.jumlah}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-navy/10 rounded-2xl p-4">
          <p className="text-xs font-bold text-navy mb-2">Prestasi berdasarkan kategori</p>
          {r.per_kategori_prestasi.length === 0 ? (
            <p className="text-xs text-navy/40">Belum ada data.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {r.per_kategori_prestasi.map((k) => (
                <span key={k.label} className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 font-semibold">
                  {k.label} · {k.jumlah}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] text-navy/40">Pelanggaran dan prestasi dua aspek yang berbeda: keduanya tidak dijumlahkan atau saling mengurangi menjadi skor.</p>
    </div>
  )
}

// ------------------------------------------------------------------ timeline

const JENIS_TIMELINE = [
  ['semua', 'Semua'],
  ['pelanggaran', 'Pelanggaran'],
  ['prestasi', 'Prestasi'],
  ['tindak_lanjut', 'Tindak lanjut'],
]

export function TimelinePembinaan({ items, jenis, onJenis }) {
  const [buka, setBuka] = useState(null)
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {JENIS_TIMELINE.map(([k, l]) => (
          <button key={k} onClick={() => onJenis(k)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${jenis === k ? 'bg-navy text-white border-navy' : 'border-navy/20 text-navy/60 hover:text-navy'}`}>
            {l}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <Kosong>Tidak ada aktivitas pada periode dan jenis data ini.</Kosong>
      ) : (
        <ol className="relative border-l-2 border-navy/10 ml-2 space-y-4">
          {items.map((e) => {
            const t = TIPE[e.tipe]
            const terbuka = buka === e.kunci
            return (
              <li key={e.kunci} className="pl-5 relative">
                <span className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-2 ring-white ${t.titik}`} />
                <button onClick={() => setBuka(terbuka ? null : e.kunci)} className="w-full text-left bg-white border border-navy/10 rounded-xl px-4 py-3 hover:border-navy/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-navy/50 tabular-nums">{tgl(e.tanggal)}</span>
                    <Badge tone={t.tone}>{t.label}</Badge>
                    {e.tipe === 'pelanggaran' && <Badge tone={TONE_TINGKAT_PELANGGARAN[e.tingkat]}>{e.badge}</Badge>}
                    {e.tipe !== 'pelanggaran' && e.badge && <Badge tone="abu">{e.badge}</Badge>}
                  </div>
                  <p className="text-sm font-semibold text-navy mt-1">{e.judul}</p>
                  <p className="text-xs text-navy/50">{e.sub}</p>
                </button>
                {terbuka && (
                  <div className="mt-2 ml-1 text-sm text-navy space-y-2">
                    {e.detail.length === 0 && !e.bukti_url && e.tindak_lanjut.length === 0 && <p className="text-xs text-navy/40">Tidak ada rincian tambahan.</p>}
                    {e.detail.map((d) => (
                      <p key={d.label}>
                        <span className="text-[11px] font-semibold text-navy/50">{d.label}: </span>
                        {d.isi}
                      </p>
                    ))}
                    {e.bukti_url && (
                      <a href={`${BASE_URL}${e.bukti_url}`} target="_blank" rel="noreferrer" className="inline-block text-xs font-semibold text-navy-light hover:underline">
                        Lihat bukti / dokumen ↗
                      </a>
                    )}
                    {e.tindak_lanjut.length > 0 && (
                      <div className="border-t border-navy/10 pt-2">
                        <p className="text-[11px] font-semibold text-navy/50 mb-1">Tindak lanjut atas pelanggaran ini</p>
                        <ul className="space-y-1">
                          {e.tindak_lanjut.map((tl) => (
                            <li key={tl.id} className="text-xs flex items-center gap-2 flex-wrap">
                              <span className="text-navy/50">{tgl(tl.tanggal_pembinaan)}</span>
                              <span className="font-semibold">{tl.jenis_tindakan}</span>
                              <span className="text-navy/50">oleh {tl.pembina}</span>
                              <Badge tone={TONE_STATUS_TL[tl.status]}>{tl.status_label}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ analisis

function Batang({ data, warna }) {
  const maks = Math.max(1, ...data.map((d) => d.jumlah))
  if (data.length === 0) return <p className="text-xs text-navy/40 py-6 text-center">Belum ada data pada periode ini.</p>
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span className="w-32 truncate text-navy/70" title={d.label}>
            {d.label}
          </span>
          <div className="flex-1 h-3 bg-navy/5 rounded-full overflow-hidden">
            <div className={`h-full ${warna}`} style={{ width: `${(d.jumlah / maks) * 100}%` }} />
          </div>
          <span className="w-6 text-right tabular-nums font-semibold text-navy">{d.jumlah}</span>
        </div>
      ))}
    </div>
  )
}

function PerBulan({ data, warna }) {
  const maks = Math.max(1, ...data.map((d) => d.jumlah))
  if (data.length === 0) return <p className="text-xs text-navy/40 py-6 text-center">Belum ada data pada periode ini.</p>
  return (
    <div className="flex items-end gap-2 h-40 overflow-x-auto pb-1">
      {data.map((d) => (
        <div key={d.bulan} className="flex flex-col items-center justify-end h-full min-w-12 flex-1">
          <span className="text-xs font-semibold text-navy tabular-nums">{d.jumlah}</span>
          <div className={`w-full max-w-10 rounded-t-md ${warna}`} style={{ height: `${Math.max(d.jumlah ? 6 : 2, (d.jumlah / maks) * 100)}%`, opacity: d.jumlah ? 1 : 0.25 }} />
          <span className="text-[10px] text-navy/50 mt-1 text-center leading-tight">{d.label.replace(/ \d{4}$/, (y) => ` '${y.trim().slice(2)}`)}</span>
        </div>
      ))}
    </div>
  )
}

export function AnalisisPembinaan({ a }) {
  const panel = (judul, isi) => (
    <div className="bg-white border border-navy/10 rounded-2xl p-4">
      <p className="text-xs font-bold text-navy mb-3">{judul}</p>
      {isi}
    </div>
  )
  return (
    <div className="space-y-5">
      <p className="text-xs text-navy/50 max-w-2xl">Grafik membantu sekolah melihat pola dan perkembangan pembinaan. Angka ini bukan penilaian moral terhadap siswa.</p>
      <div>
        <h3 className="text-sm font-extrabold text-navy mb-2">Prestasi</h3>
        <div className="grid lg:grid-cols-3 gap-3">
          {panel('Jumlah prestasi per bulan', <PerBulan data={a.prestasi_per_bulan} warna="bg-emerald-500" />)}
          {panel('Prestasi berdasarkan bidang', <Batang data={a.prestasi_per_bidang} warna="bg-emerald-500" />)}
          {panel('Prestasi berdasarkan tingkat', <Batang data={a.prestasi_per_tingkat} warna="bg-teal-500" />)}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-extrabold text-navy mb-2">Pelanggaran (dipisah dari prestasi)</h3>
        <div className="grid lg:grid-cols-3 gap-3">
          {panel('Jumlah catatan pelanggaran per bulan', <PerBulan data={a.pelanggaran_per_bulan} warna="bg-amber-500" />)}
          {panel('Pelanggaran berdasarkan kategori', <Batang data={a.pelanggaran_per_kategori} warna="bg-amber-500" />)}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------ laporan/export

const BAGIAN = [
  ['semua', 'Semua bagian'],
  ['pelanggaran', 'Riwayat pelanggaran'],
  ['prestasi', 'Riwayat prestasi'],
  ['tindak_lanjut', 'Tindak lanjut pembinaan'],
  ['timeline', 'Timeline pembinaan'],
]

/** Laporan individual: preview, PDF, Excel, dan cetak. Memakai filter yang sedang aktif. */
export function LaporanPembinaan({ siswaId, params }) {
  const [bagian, setBagian] = useState('semua')
  const [tanggal, setTanggal] = useState('')
  const [logo, setLogo] = useState(true)
  const [ttd, setTtd] = useState(true)
  const [laporan, setLaporan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sibuk, setSibuk] = useState('')
  const [cetak, setCetak] = useState(false)

  const semua = { ...params, bagian, ...(tanggal ? { tanggal_laporan: tanggal } : {}), ...(logo ? {} : { logo: '0' }), ...(ttd ? {} : { ttd: '0' }) }
  const kunci = JSON.stringify(semua)

  useEffect(() => {
    let batal = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    api
      .rpLaporan(siswaId, semua)
      .then((r) => !batal && (setLaporan(r), setError('')))
      .catch((e) => !batal && (setLaporan(null), setError(e.message)))
      .finally(() => !batal && setLoading(false))
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siswaId, kunci])

  async function unduh(format) {
    setSibuk(format)
    setError('')
    try {
      await api.rpExport(siswaId, semua, format)
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-navy/10 rounded-2xl p-4 flex items-end gap-3 flex-wrap">
        <Field label="Isi laporan">
          <select value={bagian} onChange={(e) => setBagian(e.target.value)} className={selectClass}>
            {BAGIAN.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal laporan">
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={selectClass} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-navy pb-2">
          <input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} /> Logo
        </label>
        <label className="flex items-center gap-2 text-sm text-navy pb-2">
          <input type="checkbox" checked={ttd} onChange={(e) => setTtd(e.target.checked)} /> Tanda tangan
        </label>
        <span className="flex-1" />
        <Btn disabled={!laporan || !!sibuk} onClick={() => unduh('xlsx')}>
          {sibuk === 'xlsx' ? 'Menyiapkan…' : 'Excel'}
        </Btn>
        <Btn disabled={!laporan || !!sibuk} onClick={() => unduh('pdf')}>
          {sibuk === 'pdf' ? 'Menyiapkan…' : 'PDF'}
        </Btn>
        <Btn utama disabled={!laporan} onClick={() => setCetak(true)}>
          Cetak
        </Btn>
      </div>
      <Pesan error={error} />
      {loading && !laporan && <Kosong>Menyiapkan preview…</Kosong>}
      {laporan && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <p className="text-xs text-navy/50 mb-3">
            Preview · {laporan.judul} · Periode {laporan.konteks.periode} · Catatan internal pembinaan tidak ikut dalam laporan.
          </p>
          <LaporanTampilan laporan={laporan} />
        </div>
      )}
      {cetak && laporan && <LaporanPrint laporan={laporan} onCetak={() => api.rpCatatCetak(siswaId, semua).catch(() => {})} onClose={() => setCetak(false)} />}
    </div>
  )
}
