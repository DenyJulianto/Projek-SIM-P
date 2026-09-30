const TINGKAT_LABEL = {
  sekolah: 'Sekolah',
  kecamatan: 'Kecamatan',
  kabupaten_kota: 'Kabupaten/Kota',
  provinsi: 'Provinsi',
  nasional: 'Nasional',
  internasional: 'Internasional',
}

const TINGKAT_TONE = {
  internasional: 'bg-purple-100 text-purple-700',
  nasional: 'bg-gold-light/40 text-navy',
  provinsi: 'bg-emerald-100 text-emerald-700',
}

function formatTanggal(tanggal) {
  if (!tanggal) return ''
  return new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Prestasi({ prestasi }) {
  const items = prestasi?.data || []

  return (
    <section id="prestasi" className="bg-gradient-to-b from-emerald-50/60 to-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <p className="text-gold font-semibold text-sm tracking-wide mb-2">KEBANGGAAN SEKOLAH</p>
          <h2 className="text-3xl font-extrabold text-navy">Prestasi Siswa</h2>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-navy/50">Belum ada prestasi yang dipublikasikan.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl border border-navy/10 p-5 flex gap-4 hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-gold to-gold-light text-navy flex items-center justify-center">
                  <TrophyIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        TINGKAT_TONE[item.tingkat] || 'bg-navy/5 text-navy/70'
                      }`}
                    >
                      {TINGKAT_LABEL[item.tingkat] || item.tingkat}
                    </span>
                    {item.peringkat && <span className="text-xs font-semibold text-gold">{item.peringkat}</span>}
                  </div>
                  <h3 className="font-bold text-navy leading-snug mb-1">{item.judul}</h3>
                  {item.nama_siswa && (
                    <p className="text-sm text-navy/70">
                      {item.nama_siswa}
                      {item.kelas && ` · ${item.kelas}`}
                    </p>
                  )}
                  <p className="text-xs text-navy/45 mt-1">
                    {[item.penyelenggara, formatTanggal(item.tanggal)].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function TrophyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}
