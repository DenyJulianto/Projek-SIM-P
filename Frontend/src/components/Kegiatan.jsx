function formatTanggal(tanggal) {
  if (!tanggal) return ''
  return new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Kegiatan({ kegiatan }) {
  const items = kegiatan?.data || []

  return (
    <section id="kegiatan" className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <p className="text-gold font-semibold text-sm tracking-wide mb-2">AGENDA SEKOLAH</p>
          <h2 className="text-3xl font-extrabold text-navy">Kegiatan Terbaru</h2>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-navy/50">Belum ada kegiatan yang dipublikasikan.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <article key={item.id} className="rounded-xl overflow-hidden border border-navy/10 hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-navy via-emerald-700 to-navy-light">
                  {item.gambar && <img src={item.gambar} alt={item.judul} className="h-full w-full object-cover" />}
                </div>
                <div className="p-5">
                  <p className="text-xs text-gold font-semibold mb-1">
                    {formatTanggal(item.tanggal_mulai)}
                    {item.tanggal_selesai && ` – ${formatTanggal(item.tanggal_selesai)}`}
                  </p>
                  <h3 className="font-bold text-navy mb-2">{item.judul}</h3>
                  <p className="text-sm text-navy/60 line-clamp-3">{item.deskripsi}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
