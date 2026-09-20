/** Tampilan satu lembar rapor (dipakai untuk preview dan cetak). */
export default function RaporDocument({ konten }) {
  const k = konten
  const tanggal = k.tanggal_terbit ? new Date(k.tanggal_terbit).toLocaleDateString('id-ID', { dateStyle: 'long' }) : null

  return (
    <div className="rapor-lembar bg-white text-black text-[11px] p-8 border border-navy/10 rounded-lg" style={{ pageBreakAfter: 'always' }}>
      {k._draft && <div className="border border-dashed border-amber-600 text-amber-700 text-center font-bold py-1 mb-2 rapor-draft">DRAFT — BELUM DITERBITKAN</div>}

      <div className="text-center mb-1">
        {k.template.tampilkan_logo && k.sekolah.logo && <img src={k.sekolah.logo} alt="Logo" className="h-12 mx-auto mb-1" />}
        <p className="font-bold text-[13px]">{k.sekolah.nama}</p>
        {k.sekolah.alamat && <p className="text-[9px] text-gray-500">{k.sekolah.alamat}</p>}
      </div>

      <h1 className="text-center font-bold text-[15px] mt-2">{k.template.header_text}</h1>
      <h2 className="text-center text-[12px] text-gray-600 mb-2 capitalize">
        Semester {k.semester} — Tahun Ajaran {k.tahun_ajaran}
      </h2>
      {k.nomor_rapor && (
        <p className="text-right text-[10px] text-gray-600">
          Nomor Rapor: <b>{k.nomor_rapor}</b>
        </p>
      )}

      <table className="w-full mt-2 text-[11px]">
        <tbody>
          <tr>
            <td className="pr-2 py-0.5 font-bold">Nama</td>
            <td>: {k.siswa.nama}</td>
            <td className="pr-2 py-0.5 font-bold">Kelas</td>
            <td>: {k.kelas?.nama_kelas || '-'}</td>
          </tr>
          <tr>
            <td className="pr-2 py-0.5 font-bold">NIS / NISN</td>
            <td>
              : {k.siswa.nis || '-'} / {k.siswa.nisn || '-'}
            </td>
            <td className="pr-2 py-0.5 font-bold">Wali Kelas</td>
            <td>: {k.wali_kelas?.nama || '-'}</td>
          </tr>
        </tbody>
      </table>

      <p className="font-bold text-[12px] mt-4">Nilai Akademik</p>
      <table className="w-full border-collapse border border-gray-500 mt-1">
        <thead>
          <tr className="bg-gray-100">
            {['No', 'Mata Pelajaran', 'Harian', 'Tugas', 'UTS', 'UAS', 'Nilai Akhir'].map((h) => (
              <th key={h} className="border border-gray-500 px-1.5 py-1 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {k.nilai.length === 0 && (
            <tr>
              <td colSpan={7} className="border border-gray-500 px-2 py-2 text-center">
                Belum ada data nilai.
              </td>
            </tr>
          )}
          {k.nilai.map((n, i) => (
            <tr key={n.mata_pelajaran}>
              <td className="border border-gray-500 px-1.5 py-1 text-center">{i + 1}</td>
              <td className="border border-gray-500 px-1.5 py-1">{n.mata_pelajaran}</td>
              {['harian', 'tugas', 'uts', 'uas'].map((j) => (
                <td key={j} className="border border-gray-500 px-1.5 py-1 text-center">
                  {n.rincian[j] ?? '-'}
                </td>
              ))}
              <td className="border border-gray-500 px-1.5 py-1 text-center font-bold">{n.rata_rata}</td>
            </tr>
          ))}
          {k.nilai.length > 0 && (
            <tr>
              <td colSpan={6} className="border border-gray-500 px-1.5 py-1 text-right font-bold">
                Rata-rata Keseluruhan
              </td>
              <td className="border border-gray-500 px-1.5 py-1 text-center font-bold">{k.rata_rata_umum}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="font-bold text-[12px] mt-4">Rekap Kehadiran</p>
      <table className="w-full border-collapse border border-gray-500 mt-1 text-center">
        <thead>
          <tr className="bg-gray-100">
            {['Hadir', 'Izin', 'Sakit', 'Alpha'].map((h) => (
              <th key={h} className="border border-gray-500 px-1.5 py-1">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {['hadir', 'izin', 'sakit', 'alpha'].map((s) => (
              <td key={s} className="border border-gray-500 px-1.5 py-1">
                {k.absensi[s]}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {k.catatan_wali_kelas && (
        <>
          <p className="font-bold text-[12px] mt-4">Catatan Wali Kelas</p>
          <p className="mt-1">{k.catatan_wali_kelas}</p>
        </>
      )}

      <div className="grid grid-cols-2 gap-6 text-center mt-8">
        <div>
          <p>Wali Kelas</p>
          <div className="h-12" />
          <p className="font-bold">{k.wali_kelas?.nama || '(.........................)'}</p>
        </div>
        <div>
          <p>{tanggal || ' '}</p>
          <p>{k.penandatangan?.jabatan || 'Kepala Sekolah'}</p>
          <div className="h-12" />
          <p className="font-bold">{k.penandatangan?.nama || '(.........................)'}</p>
        </div>
      </div>

      {k.template.catatan_kaki && <p className="mt-4 text-[9px] text-gray-500">{k.template.catatan_kaki}</p>}
    </div>
  )
}
