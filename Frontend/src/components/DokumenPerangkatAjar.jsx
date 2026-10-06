import { KONTEN_HTML } from './EditorTeks'
import { FIELD, htmlAman, KURIKULUM_META, labelFase, normalisasi, TAHAP, teksAlokasi, teksPolos } from '../lib/perangkatAjar'

const JENIS_LAMPIRAN = { lkpd: 'LKPD', rubrik: 'Rubrik Penilaian', bahan_bacaan: 'Bahan Bacaan', lainnya: 'Lainnya' }

function Html({ nilai }) {
  return <div className={`text-sm text-slate-800 leading-relaxed ${KONTEN_HTML}`} dangerouslySetInnerHTML={{ __html: htmlAman(nilai) }} />
}

function Bagian({ huruf, judul, children }) {
  return (
    <section className="mt-5 break-inside-avoid-page">
      <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1 mb-2">
        {huruf}. {judul}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function Butir({ label, children }) {
  return (
    <div>
      {label && <p className="text-[13px] font-semibold text-slate-700 mb-0.5">{label}</p>}
      {children}
    </div>
  )
}

// Tampilan dokumen perangkat ajar (sama susunannya dengan PDF/Word).
export default function DokumenPerangkatAjar({ modul, identitas }) {
  const kurikulum = modul.kurikulum
  const merdeka = kurikulum === 'merdeka'
  const d = normalisasi(modul.data, kurikulum)
  const ada = (k) => !!teksPolos(d[k])

  const baris = [
    ['Satuan Pendidikan', d.institusi || d.nama_sekolah || identitas?.institusi],
    ['Nama Guru', d.nama_guru || identitas?.nama_guru],
    ['Mata Pelajaran', modul.mata_pelajaran],
    ['Kelas / Semester', [modul.kelas, d.semester].filter(Boolean).join(' / ')],
    merdeka && ['Jenjang / Fase', [d.jenjang || identitas?.jenjang, labelFase(d.fase)].filter(Boolean).join(' / ')],
    !merdeka && ['Materi Pokok', d.materi_pokok],
    ['Alokasi Waktu', teksAlokasi(d)],
    ['Tahun Penyusunan', d.tahun_penyusunan || identitas?.tahun_penyusunan],
  ].filter((b) => b && b[1])

  const bagian = []
  const tambah = (judul, isi) => isi && bagian.push([judul, isi])
  const htmlField = (f) => ada(f.k) && <Butir key={f.k} label={f.label}><Html nilai={d[f.k]} /></Butir>
  const daftar = (arr) =>
    arr?.length ? (
      <ul className="list-disc pl-6 text-sm text-slate-800">
        {arr.map((x) => <li key={x}>{x}</li>)}
      </ul>
    ) : null
  const pertemuan = (d.pertemuan || []).some((p) => TAHAP[kurikulum].some((t) => teksPolos(p.tahap?.[t.k]?.isi))) && (
    <div className="space-y-3">
      {d.pertemuan.map((p, i) => {
        const total = TAHAP[kurikulum].reduce((s, t) => s + (Number(p.tahap?.[t.k]?.durasi) || 0), 0)
        return (
          <div key={i}>
            <p className="text-[13px] font-semibold italic text-slate-800 mb-1">
              Pertemuan {i + 1}
              {p.topik ? `: ${p.topik}` : ''}
              {total ? ` (${total} menit)` : ''}
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-50/70 text-left text-slate-700">
                  <th className="border border-slate-300 px-2 py-1 w-[22%]">Tahap</th>
                  <th className="border border-slate-300 px-2 py-1">Kegiatan</th>
                  <th className="border border-slate-300 px-2 py-1 w-[14%]">Durasi</th>
                </tr>
              </thead>
              <tbody>
                {TAHAP[kurikulum].map((t) => (
                  <tr key={t.k}>
                    <td className="border border-slate-300 px-2 py-1 align-top font-semibold">{t.label}</td>
                    <td className="border border-slate-300 px-2 py-1 align-top">
                      {teksPolos(p.tahap?.[t.k]?.isi) ? <Html nilai={p.tahap[t.k].isi} /> : '-'}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 align-top">
                      {p.tahap?.[t.k]?.durasi ? `${p.tahap[t.k].durasi} menit` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )

  if (merdeka) {
    tambah(
      'Capaian Pembelajaran',
      d.cp?.length > 0 &&
        d.cp.map((c) => (
          <Butir key={c.id} label={`Elemen: ${c.elemen}`}>
            <p className="text-sm text-slate-800 leading-relaxed">{c.deskripsi}</p>
          </Butir>
        ))
    )
    tambah(
      'Tujuan Pembelajaran',
      (d.tp_master?.length > 0 || ada('tujuan_pembelajaran')) && (
        <>
          {d.tp_master?.length > 0 && (
            <ol className="list-decimal pl-6 text-sm text-slate-800">
              {d.tp_master.map((t) => <li key={t.id}>{t.deskripsi}</li>)}
            </ol>
          )}
          {ada('tujuan_pembelajaran') && <Html nilai={d.tujuan_pembelajaran} />}
        </>
      )
    )
    tambah('Dimensi Profil Lulusan', daftar(d.dimensi_profil))
    tambah('Kompetensi Awal', ada('kompetensi_awal') && <Html nilai={d.kompetensi_awal} />)
    tambah('Sarana dan Prasarana', ada('sarana_prasarana') && <Html nilai={d.sarana_prasarana} />)
    tambah('Target Peserta Didik', daftar(d.target_peserta))
    tambah('Pemahaman Bermakna', ada('pemahaman_bermakna') && <Html nilai={d.pemahaman_bermakna} />)
    tambah('Pertanyaan Pemantik', ada('pertanyaan_pemantik') && <Html nilai={d.pertanyaan_pemantik} />)
    const pm = FIELD.merdeka.pembelajaranMendalam.map(htmlField).filter(Boolean)
    tambah('Desain Pembelajaran Mendalam', pm.length > 0 && pm)
    tambah(
      'Kegiatan Pembelajaran',
      (pertemuan || ada('strategi_diferensiasi')) && (
        <>
          {pertemuan}
          {htmlField(FIELD.merdeka.kegiatan[0])}
        </>
      )
    )
    const asesmen = FIELD.merdeka.asesmen.slice(0, 4).map(htmlField).filter(Boolean)
    tambah('Asesmen', asesmen.length > 0 && asesmen)
    const pr = FIELD.merdeka.asesmen.slice(4, 6).map(htmlField).filter(Boolean)
    tambah('Pengayaan dan Remedial', pr.length > 0 && pr)
    const rf = FIELD.merdeka.asesmen.slice(6, 8).map(htmlField).filter(Boolean)
    tambah('Refleksi', rf.length > 0 && rf)
    tambah('Glosarium', ada('glosarium') && <Html nilai={d.glosarium} />)
    tambah('Daftar Pustaka', ada('daftar_pustaka') && <Html nilai={d.daftar_pustaka} />)
  } else {
    const tujuan = [
      htmlField({ k: 'kompetensi_dasar', label: 'Kompetensi Dasar (KD)' }),
      htmlField({ k: 'tujuan_pembelajaran', label: 'Tujuan Pembelajaran' }),
      d.kkm && <Butir key="kkm" label="Kriteria Ketuntasan Minimal (KKM)"><p className="text-sm">{d.kkm}</p></Butir>,
    ].filter(Boolean)
    tambah('Tujuan Pembelajaran', tujuan.length > 0 && tujuan)
    tambah(
      'Langkah-Langkah Pembelajaran',
      (d.model_pembelajaran || pertemuan) && (
        <>
          {d.model_pembelajaran && <Butir label="Model Pembelajaran"><p className="text-sm">{d.model_pembelajaran}</p></Butir>}
          {pertemuan}
        </>
      )
    )
    const nilai = FIELD.k13.asesmen.map(htmlField).filter(Boolean)
    tambah('Penilaian Pembelajaran', nilai.length > 0 && nilai)
  }
  tambah(
    'Lampiran',
    modul.lampiran?.length > 0 && daftar(modul.lampiran.map((l) => `${JENIS_LAMPIRAN[l.jenis] || 'Lampiran'}: ${l.nama_file}`))
  )

  return (
    <article className="bg-white text-slate-900">
      <header className="text-center">
        <p className="text-base font-extrabold tracking-wide">{merdeka ? 'MODUL AJAR' : 'RENCANA PELAKSANAAN PEMBELAJARAN (RPP)'}</p>
        <p className="text-sm text-slate-600">{KURIKULUM_META[kurikulum].label}</p>
        <p className="text-sm font-bold uppercase mt-0.5">{modul.judul || '(Tanpa judul)'}</p>
      </header>
      <table className="mt-4 text-sm">
        <tbody>
          {baris.map(([label, nilai]) => (
            <tr key={label}>
              <td className="pr-3 py-0.5 align-top text-slate-600 whitespace-nowrap">{label}</td>
              <td className="pr-2 py-0.5 align-top">:</td>
              <td className="py-0.5 align-top">{nilai}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {bagian.map(([judul, isi], i) => (
        <Bagian key={judul} huruf={String.fromCharCode(65 + i)} judul={judul}>
          {isi}
        </Bagian>
      ))}
      {bagian.length === 0 && <p className="mt-6 text-sm text-slate-400 italic">Belum ada isian.</p>}
    </article>
  )
}
