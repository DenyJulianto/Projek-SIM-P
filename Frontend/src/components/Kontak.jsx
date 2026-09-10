export default function Kontak({ profil }) {
  return (
    <section id="kontak" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="bg-gradient-to-br from-navy via-emerald-800 to-navy-light rounded-2xl px-8 py-14 text-center text-white shadow-xl shadow-emerald-900/20">
          <p className="text-gold font-semibold text-sm tracking-wide mb-2">PENDAFTARAN</p>
          <h2 className="text-3xl font-extrabold mb-3">Mulai Perjalanan Pendidikan Bersama Kami</h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Hubungi kami untuk informasi pendaftaran, kunjungan sekolah, atau pertanyaan lainnya.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-white/90 text-sm">
            {profil?.alamat && <span>📍 {profil.alamat}</span>}
            {profil?.telepon && <span>📞 {profil.telepon}</span>}
            {profil?.email && <span>✉️ {profil.email}</span>}
          </div>
        </div>
      </div>
    </section>
  )
}
