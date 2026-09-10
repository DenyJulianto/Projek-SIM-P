export default function Hero({ profil }) {
  return (
    <section id="beranda" className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-24 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-gold font-semibold tracking-wide text-sm mb-2">SELAMAT DATANG</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-navy leading-tight">
            Mendidik Generasi,
            <br />
            <span className="text-gold">Membangun Masa Depan.</span>
          </h1>
          <p className="mt-5 text-navy/70 max-w-md">
            {profil?.visi || 'Lingkungan belajar yang mendukung siswa untuk tumbuh, berkembang, dan menjadi pemimpin masa depan.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#tentang"
              className="bg-gradient-to-r from-navy to-navy-light hover:opacity-90 text-white font-semibold text-sm px-6 py-3 rounded-md transition-opacity"
            >
              Kenali Kami →
            </a>
            <a
              href="#kegiatan"
              className="border border-navy/20 hover:border-navy text-navy font-semibold text-sm px-6 py-3 rounded-md transition-colors"
            >
              Lihat Kegiatan
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-4/3 rounded-2xl overflow-hidden bg-gradient-to-br from-navy via-emerald-700 to-navy-light shadow-xl shadow-emerald-900/20">
            {profil?.hero_image && (
              <img src={profil.hero_image} alt="Sekolah" className="h-full w-full object-cover" />
            )}
          </div>
          {profil?.npsn && (
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg px-5 py-4 hidden sm:block">
              <p className="text-xs text-navy/50">NPSN Terdaftar</p>
              <p className="font-bold text-navy">{profil.npsn}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 -mt-6 relative z-10">
        <div className="bg-gradient-to-r from-navy via-emerald-800 to-navy-light rounded-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-white/10 text-white overflow-hidden shadow-lg shadow-emerald-900/20">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-5 text-center sm:text-left">
              <p className="text-2xl mb-1">{f.icon}</p>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-xs text-white/60 mt-1 hidden sm:block">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  { icon: '🎓', title: 'Pendidikan Holistik', desc: 'Membina akademik, karakter, dan sosial siswa.' },
  { icon: '👩‍🏫', title: 'Guru Berpengalaman', desc: 'Tenaga pendidik yang kompeten dan berdedikasi.' },
  { icon: '💡', title: 'Pembelajaran Inovatif', desc: 'Metode dan fasilitas belajar modern.' },
  { icon: '🌐', title: 'Wawasan Global', desc: 'Menyiapkan siswa untuk dunia yang luas.' },
  { icon: '🛡️', title: 'Lingkungan Aman', desc: 'Kampus yang nyaman untuk semua siswa.' },
]
