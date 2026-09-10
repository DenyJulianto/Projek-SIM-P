function formatTanggal(tanggal) {
  if (!tanggal) return ''
  return new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Pengumuman({ pengumuman }) {
  const items = pengumuman?.data || []

  return (
    <section id="pengumuman" className="bg-neutral-50 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-12">
          <p className="text-gold font-semibold text-sm tracking-wide mb-2">INFORMASI TERKINI</p>
          <h2 className="text-3xl font-extrabold text-navy">Pengumuman</h2>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-navy/50">Belum ada pengumuman.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="bg-white rounded-xl border border-navy/10 p-5 flex gap-5">
                <div className="shrink-0 w-16 text-center">
                  <p className="text-2xl font-extrabold text-navy leading-none">
                    {new Date(item.tanggal_publish).getDate()}
                  </p>
                  <p className="text-xs text-gold font-semibold uppercase">
                    {new Date(item.tanggal_publish).toLocaleDateString('id-ID', { month: 'short' })}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-navy mb-1">{item.judul}</h3>
                  <p className="text-sm text-navy/60">{item.konten}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
