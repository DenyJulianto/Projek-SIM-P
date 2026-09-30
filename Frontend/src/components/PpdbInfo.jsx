const STATUS_TONE = {
  dibuka: 'bg-emerald-100 text-emerald-700',
  ditutup: 'bg-navy/10 text-navy/70',
  seleksi: 'bg-amber-100 text-amber-800',
  pengumuman: 'bg-gold-light/40 text-navy',
  daftar_ulang: 'bg-blue-100 text-blue-700',
}

function tgl(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function rentang(a, b) {
  if (!a && !b) return null
  if (a && b) return `${tgl(a)} – ${tgl(b)}`
  return tgl(a || b)
}

/**
 * Bagian PPDB di landing page sekolah — data dari /public/ppdb (periode
 * yang sedang berjalan). Tidak dirender bila sekolah tidak punya PPDB aktif.
 */
export default function PpdbInfo({ ppdb, profil }) {
  if (!ppdb?.nama) return null

  const jadwal = [
    ['Pendaftaran', rentang(ppdb.tanggal_mulai, ppdb.tanggal_selesai), ['dibuka']],
    ['Seleksi', tgl(ppdb.jadwal_seleksi), ['ditutup', 'seleksi']],
    ['Pengumuman', tgl(ppdb.jadwal_pengumuman), ['pengumuman']],
    ['Daftar Ulang', rentang(ppdb.daftar_ulang_mulai, ppdb.daftar_ulang_selesai), ['daftar_ulang']],
  ].filter(([, waktu]) => waktu)

  const persyaratanUmum = ppdb.persyaratan.filter((r) => !r.jalur)
  const persyaratanJalur = ppdb.persyaratan.filter((r) => r.jalur)
  const kontak = [profil?.telepon, profil?.email].filter(Boolean)

  return (
    <section id="ppdb" className="py-20 bg-gradient-to-b from-white to-emerald-50/50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-10">
          <p className="text-gold font-semibold text-sm tracking-wide mb-2">PENERIMAAN PESERTA DIDIK BARU</p>
          <h2 className="text-3xl font-extrabold text-navy">{ppdb.nama}</h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-navy/60">
            {ppdb.tahun_ajaran && <span>Tahun Ajaran {ppdb.tahun_ajaran}</span>}
            {ppdb.jenjang && <span>· {ppdb.jenjang}</span>}
            <span>· Kuota {ppdb.kuota} siswa</span>
            <span className={`ml-1 text-xs font-bold px-3 py-1 rounded-full ${STATUS_TONE[ppdb.status] || 'bg-navy/10 text-navy'}`}>
              {ppdb.status_label}
            </span>
          </div>
        </div>

        {jadwal.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {jadwal.map(([judul, waktu, aktifSaat], i) => {
              const aktif = aktifSaat.includes(ppdb.status)
              return (
                <div
                  key={judul}
                  className={`rounded-xl border p-5 ${aktif ? 'bg-navy text-white border-navy shadow-lg shadow-emerald-900/20' : 'bg-white border-navy/10'}`}
                >
                  <p className={`text-xs font-semibold mb-1 ${aktif ? 'text-gold-light' : 'text-gold'}`}>
                    TAHAP {i + 1}
                    {aktif && ' · SEDANG BERLANGSUNG'}
                  </p>
                  <p className={`font-bold ${aktif ? 'text-white' : 'text-navy'}`}>{judul}</p>
                  <p className={`text-sm mt-1 ${aktif ? 'text-white/80' : 'text-navy/60'}`}>{waktu}</p>
                </div>
              )
            })}
          </div>
        )}

        {ppdb.jalur.length > 0 && (
          <>
            <h3 className="text-xl font-extrabold text-navy mb-4">Jalur Pendaftaran</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {ppdb.jalur.map((j) => (
                <article key={j.id} className="bg-white rounded-xl border border-navy/10 p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-bold text-navy">{j.nama}</h4>
                    <span className="shrink-0 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                      Kuota {j.kuota}
                    </span>
                  </div>
                  {j.deskripsi && <p className="text-sm text-navy/60">{j.deskripsi}</p>}
                </article>
              ))}
            </div>
          </>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-navy/10 p-6">
            <h3 className="font-extrabold text-navy mb-3">Persyaratan Dokumen</h3>
            {ppdb.persyaratan.length === 0 ? (
              <p className="text-sm text-navy/50">Informasi persyaratan dapat ditanyakan langsung ke panitia PPDB.</p>
            ) : (
              <ul className="space-y-2 text-sm text-navy/70">
                {persyaratanUmum.map((r, i) => (
                  <Persyaratan key={`u${i}`} r={r} />
                ))}
                {persyaratanJalur.map((r, i) => (
                  <Persyaratan key={`j${i}`} r={r} />
                ))}
              </ul>
            )}
          </div>

          <div className="bg-gradient-to-br from-navy via-emerald-800 to-navy-light rounded-2xl p-6 text-white">
            <h3 className="font-extrabold mb-2">Cara Mendaftar</h3>
            <p className="text-sm text-white/80 mb-4">
              {ppdb.status === 'dibuka'
                ? 'Siapkan dokumen persyaratan, lalu datang ke sekolah atau hubungi panitia PPDB untuk didaftarkan.'
                : 'Masa pendaftaran tidak sedang dibuka. Hubungi panitia PPDB untuk informasi lebih lanjut.'}
            </p>
            {ppdb.catatan && <p className="text-sm text-white/80 mb-4 whitespace-pre-line">{ppdb.catatan}</p>}
            {(kontak.length > 0 || profil?.alamat) && (
              <div className="space-y-1 text-sm">
                {profil?.alamat && <p>📍 {profil.alamat}</p>}
                {profil?.telepon && <p>📞 {profil.telepon}</p>}
                {profil?.email && <p>✉️ {profil.email}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Persyaratan({ r }) {
  return (
    <li className="flex gap-2">
      <span className="text-emerald-600 mt-0.5">✓</span>
      <span>
        <span className="font-medium text-navy">{r.nama}</span>
        {!r.wajib && <span className="text-navy/40"> (opsional)</span>}
        {r.jalur && <span className="text-xs text-gold font-semibold"> · khusus {r.jalur}</span>}
        {r.keterangan && <span className="block text-xs text-navy/50">{r.keterangan}</span>}
      </span>
    </li>
  )
}
