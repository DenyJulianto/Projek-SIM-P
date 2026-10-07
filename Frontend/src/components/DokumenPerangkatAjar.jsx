import { KONTEN_HTML } from './EditorTeks'
import {
  atpLengkap,
  FIELD,
  htmlAman,
  kalimatAtp,
  KURIKULUM_META,
  normalisasi,
  RUMUS_NILAI_BAWAAN,
  TAHAP,
  teksAlokasi,
  teksPolos,
} from '../lib/perangkatAjar'

const JENIS_LAMPIRAN = { lkpd: 'LKPD', rubrik: 'Rubrik Penilaian', bahan_bacaan: 'Bahan Bacaan', lainnya: 'Lainnya' }

function Html({ nilai }) {
  return <div className={`text-sm text-slate-800 leading-relaxed ${KONTEN_HTML}`} dangerouslySetInnerHTML={{ __html: htmlAman(nilai) }} />
}

function Bagian({ judul, children }) {
  return (
    <section className="mt-5 break-inside-avoid-page">
      <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1 mb-2">{judul}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function Butir({ label, miring, children }) {
  return (
    <div>
      {label && <p className={`text-[13px] font-semibold text-slate-700 mb-0.5 ${miring ? 'italic' : ''}`}>{label}</p>}
      {children}
    </div>
  )
}

function SubJudul({ children }) {
  return <p className="text-[13px] font-bold text-slate-900 pt-2">{children}</p>
}

function Daftar({ isi }) {
  return isi?.length ? (
    <ul className="list-disc pl-6 text-sm text-slate-800">
      {isi.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  ) : null
}

function TabelInfo({ baris, lebarLabel = 'w-56' }) {
  return (
    <table className="text-sm">
      <tbody>
        {baris.map(([label, nilai]) => (
          <tr key={label}>
            <td className={`pr-3 py-0.5 align-top text-slate-600 ${lebarLabel}`}>{label}</td>
            <td className="pr-2 py-0.5 align-top">:</td>
            <td className="py-0.5 align-top">{nilai}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TabelPertemuan({ d, kurikulum }) {
  const ada = (d.pertemuan || []).some((p) => TAHAP[kurikulum].some((t) => teksPolos(p.tahap?.[t.k]?.isi)))
  if (!ada) return null
  return (
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
                    <td className="border border-slate-300 px-2 py-1 align-top">{p.tahap?.[t.k]?.durasi ? `${p.tahap[t.k].durasi} menit` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function TandaTangan({ d, identitas, kepala }) {
  const jabatan = ['SD', 'MI'].includes(String(d.jenjang || identitas?.jenjang || '').toUpperCase()) ? 'Guru Kelas' : 'Guru Mata Pelajaran'
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const kota = d.kota || identitas?.kota
  return (
    <div className="mt-8 grid grid-cols-2 gap-6 text-sm break-inside-avoid">
      <div>
        <p>&nbsp;</p>
        <p>Mengetahui,</p>
        <p>Kepala Sekolah</p>
        <div className="h-16" />
        <p className="font-bold underline">{kepala || '(.................................)'}</p>
        <p>NIP. -</p>
      </div>
      <div>
        <p>{[kota, tanggal].filter(Boolean).join(', ')}</p>
        <p>&nbsp;</p>
        <p>{jabatan}</p>
        <div className="h-16" />
        <p className="font-bold underline">{d.nama_guru || identitas?.nama_guru || '(.................................)'}</p>
        <p>NIP. {d.nip_guru || identitas?.nip_guru || '-'}</p>
      </div>
    </div>
  )
}

// Tampilan dokumen perangkat ajar (sama susunannya dengan PDF/Word).
export default function DokumenPerangkatAjar({ modul, identitas }) {
  if (modul.kurikulum === 'merdeka') return <DokumenMerdeka modul={modul} identitas={identitas} />
  return <DokumenK13 modul={modul} identitas={identitas} />
}

/** Modul Ajar Kurikulum Merdeka Belajar (RPP+): sampul, A–C, rekapitulasi, tanda tangan. */
function DokumenMerdeka({ modul, identitas }) {
  const d = normalisasi(modul.data, 'merdeka')
  const ada = (k) => !!teksPolos(d[k])
  const fase = d.fase ? `Fase ${d.fase}` : null
  const sekolah = d.institusi || identitas?.institusi
  const kota = d.kota || identitas?.kota
  const metode = [...(d.metode || []), d.metode_lain].filter(Boolean)
  const html = (k, label) => ada(k) && <Butir key={k} label={label} miring><Html nilai={d[k]} /></Butir>
  const atp = atpLengkap(d)
  const atpGrup = atp.reduce((g, a) => {
    const w = a.waktu?.trim() || 'Tanpa keterangan waktu'
    ;(g[w] ||= []).push(kalimatAtp(a))
    return g
  }, {})

  const info = [
    ['Nama Penyusun', d.nama_guru || identitas?.nama_guru],
    ['Institusi', sekolah],
    ['Mata Pelajaran', modul.mata_pelajaran],
    ['Bab / Tema / Unit', d.bab_tema],
    ['Jenjang / Fase / Kelas / Semester', [d.jenjang || identitas?.jenjang, fase, modul.kelas && `Kelas ${modul.kelas}`, d.semester && `Semester ${d.semester}`].filter(Boolean).join(', ')],
    ['Alokasi Waktu', teksAlokasi(d)],
    ['Tahun Ajaran', d.tahun_ajaran],
    ['Moda Pembelajaran', d.moda],
    ['Metode Pembelajaran', metode.join(', ')],
    ['Model Pembelajaran', d.model_pembelajaran],
    ['Target Peserta Didik', (d.target_peserta || []).join('; ')],
    ['Jumlah Peserta Didik', d.jumlah_peserta && `${d.jumlah_peserta} peserta didik`],
  ].filter((b) => b[1])

  // B. Komponen Inti — hanya sub-bagian yang ada isinya, dinomori berurutan.
  const inti = []
  const sub = (judul, isi) => {
    const ada = (Array.isArray(isi) ? isi : [isi]).filter(Boolean)
    if (ada.length) inti.push([judul, ada])
  }
  sub('Capaian Pembelajaran (CP)', [
    html('cp_umum', `Capaian Pembelajaran Umum${fase ? ` (${fase})` : ''}`),
    d.cp?.length > 0 && (
      <Butir key="cp" label="Capaian Pembelajaran per Elemen" miring>
        {d.cp.map((c) => (
          <div key={c.id} className="mb-1.5">
            <p className="text-sm font-semibold text-slate-800">Elemen: {c.elemen}</p>
            <p className="text-sm text-slate-800 leading-relaxed">{c.deskripsi}</p>
          </div>
        ))}
      </Butir>
    ),
  ])
  sub('Tujuan Pembelajaran (TP)', [
    d.tp_master?.length > 0 && (
      <ol key="tp" className="list-decimal pl-6 text-sm text-slate-800">
        {d.tp_master.map((t) => (
          <li key={t.id}>{t.deskripsi}</li>
        ))}
      </ol>
    ),
    ada('tujuan_pembelajaran') && <Html key="tpx" nilai={d.tujuan_pembelajaran} />,
  ])
  sub(
    'Alur Tujuan Pembelajaran (ATP)',
    atp.length > 0 && (
      <table key="atp" className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-emerald-50/70 text-left text-slate-700">
            <th className="border border-slate-300 px-2 py-1 w-[22%]">Waktu</th>
            <th className="border border-slate-300 px-2 py-1">Alur Tujuan Pembelajaran</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(atpGrup).map(([waktu, kalimat]) => (
            <tr key={waktu}>
              <td className="border border-slate-300 px-2 py-1 align-top font-semibold">{waktu}</td>
              <td className="border border-slate-300 px-2 py-1 align-top">
                <ol className="list-decimal pl-5">
                  {kalimat.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ol>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  )
  sub('Pemahaman Bermakna', ada('pemahaman_bermakna') && <Html key="pb" nilai={d.pemahaman_bermakna} />)
  sub('Materi Inti', ada('materi_inti') && <Html key="mi" nilai={d.materi_inti} />)
  sub('Asesmen', [
    html('asesmen_diagnostik', 'Asesmen Diagnostik (awal pembelajaran)'),
    html('asesmen_formatif', 'Asesmen Formatif (selama pembelajaran)'),
    html('asesmen_sumatif', 'Asesmen Sumatif (akhir pembelajaran)'),
  ])
  sub('Kegiatan Pembelajaran', [
    <TabelPertemuan key="p" d={d} kurikulum="merdeka" />,
    html('kegiatan_alternatif', 'Kegiatan Alternatif (bila media utama tidak tersedia)'),
  ])
  sub('Refleksi', [
    html('refleksi_guru', 'Refleksi Guru'),
    html('refleksi_siswa', 'Refleksi Peserta Didik'),
    html('pemetaan_kemampuan', 'Pemetaan Kemampuan Peserta Didik (untuk Diferensiasi)'),
  ])
  sub('Interaksi dengan Orang Tua / Wali', ada('interaksi_ortu') && <Html key="io" nilai={d.interaksi_ortu} />)

  // C. Lampiran
  const lampiran = [
    html('bahan_bacaan', 'Bahan Bacaan Guru dan Peserta Didik'),
    ada('lkpd') && (
      <Butir key="lkpd" label="Lembar Kerja Peserta Didik (LKPD)" miring>
        <table className="w-full border-collapse text-sm mb-2">
          <tbody>
            <tr>
              <td className="border border-slate-300 px-2 py-1.5 w-2/3">Nama: ...............................................</td>
              <td className="border border-slate-300 px-2 py-1.5">Nilai: ............</td>
            </tr>
          </tbody>
        </table>
        <Html nilai={d.lkpd} />
      </Butir>
    ),
    html('rubrik_sikap', 'Rubrik Penilaian Sikap (skor 1–4)'),
    html('rubrik_pengetahuan', 'Rubrik Penilaian Pengetahuan dan Keterampilan'),
  ].filter(Boolean)
  if (lampiran.length || d.rumus_nilai) {
    lampiran.push(
      <Butir key="rumus" label="Pengolahan Nilai" miring>
        <p className="text-sm text-slate-800">{d.rumus_nilai || RUMUS_NILAI_BAWAAN}</p>
      </Butir>
    )
  }
  lampiran.push(
    ...[
      html('remedial', 'Remedial'),
      html('pengayaan', 'Pengayaan'),
      modul.lampiran?.length > 0 && (
        <Butir key="berkas" label="Berkas Lampiran" miring>
          <Daftar isi={modul.lampiran.map((l) => `${JENIS_LAMPIRAN[l.jenis] || 'Lampiran'}: ${l.nama_file}`)} />
        </Butir>
      ),
      html('daftar_pustaka', 'Daftar Pustaka'),
    ].filter(Boolean)
  )

  // Rekapitulasi: topik pertemuan & TP per elemen.
  const topik = (d.pertemuan || []).map((p) => p.topik?.trim()).filter(Boolean)
  const tpElemen = (d.tp_master || []).reduce((g, t) => {
    ;(g[t.elemen || 'Tujuan Pembelajaran'] ||= []).push(t.deskripsi)
    return g
  }, {})

  const sampulBaris = [
    ['Penyusun', d.nama_guru || identitas?.nama_guru],
    ['NIP', d.nip_guru || identitas?.nip_guru || '-'],
    ['Kelas / Semester', [modul.kelas, d.semester].filter(Boolean).join(' / ')],
    ['Mata Pelajaran', modul.mata_pelajaran],
  ].filter((b) => b[1])

  return (
    <article className="bg-white text-slate-900">
      {/* Sampul */}
      <div className="text-center border border-slate-200 rounded-lg px-6 py-12 mb-8">
        <p className="text-lg font-extrabold tracking-wide">MODUL AJAR KURIKULUM MERDEKA BELAJAR (RPP+)</p>
        <p className="text-base font-bold uppercase mt-3">{modul.judul || '(Tanpa judul)'}</p>
        <div className="inline-block text-left mt-10">
          <TabelInfo baris={sampulBaris.map(([l, v]) => [l, <b key={l}>{v}</b>])} lebarLabel="w-36" />
        </div>
        <div className="mt-10 space-y-0.5 font-bold uppercase text-sm">
          {sekolah && <p>{sekolah}</p>}
          {kota && <p>{kota}</p>}
          {d.tahun_ajaran && <p className="normal-case">Tahun Ajaran {d.tahun_ajaran}</p>}
        </div>
      </div>

      <header className="text-center">
        <p className="text-base font-extrabold tracking-wide">MODUL AJAR</p>
        <p className="text-sm text-slate-600">Kurikulum Merdeka Belajar (RPP+)</p>
        <p className="text-sm font-bold uppercase mt-0.5">{modul.judul || '(Tanpa judul)'}</p>
      </header>

      <Bagian judul="A. Informasi Umum">
        <TabelInfo baris={info} />
        {html('karakteristik_peserta', 'Karakteristik Peserta Didik')}
        {d.profil_pelajar?.length > 0 && (
          <Butir label="Profil Pelajar Pancasila" miring>
            <Daftar isi={d.profil_pelajar} />
          </Butir>
        )}
        {html('sarana_prasarana', 'Sarana dan Prasarana')}
      </Bagian>

      {inti.length > 0 && (
        <Bagian judul="B. Komponen Inti">
          {inti.map(([judul, isi], i) => (
            <div key={judul} className="space-y-2">
              <SubJudul>
                {i + 1}. {judul}
              </SubJudul>
              {isi}
            </div>
          ))}
        </Bagian>
      )}

      {lampiran.length > 0 && <Bagian judul="C. Lampiran">{lampiran}</Bagian>}

      {(topik.length > 0 || Object.keys(tpElemen).length > 0) && (
        <Bagian judul="Rekapitulasi">
          {topik.length > 0 && (
            <Butir label="Daftar Topik / Materi yang Dibahas" miring>
              <Daftar isi={topik} />
            </Butir>
          )}
          {Object.entries(tpElemen).map(([elemen, daftar]) => (
            <Butir key={elemen} label={`Tujuan Pembelajaran — Elemen ${elemen}`} miring>
              <Daftar isi={daftar} />
            </Butir>
          ))}
        </Bagian>
      )}

      <TandaTangan d={d} identitas={identitas} />
    </article>
  )
}

/** RPP 1 lembar Kurikulum 2013. */
function DokumenK13({ modul, identitas }) {
  const kurikulum = 'k13'
  const d = normalisasi(modul.data, kurikulum)
  const ada = (k) => !!teksPolos(d[k])
  const htmlField = (f) => ada(f.k) && <Butir key={f.k} label={f.label}><Html nilai={d[f.k]} /></Butir>

  const baris = [
    ['Satuan Pendidikan', d.nama_sekolah || d.institusi || identitas?.institusi],
    ['Nama Guru', d.nama_guru || identitas?.nama_guru],
    ['Mata Pelajaran', modul.mata_pelajaran],
    ['Kelas / Semester', [modul.kelas, d.semester].filter(Boolean).join(' / ')],
    ['Materi Pokok', d.materi_pokok],
    ['Alokasi Waktu', teksAlokasi(d)],
    ['Tahun Penyusunan', d.tahun_penyusunan || identitas?.tahun_penyusunan],
  ].filter((b) => b[1])

  const bagian = []
  const tambah = (judul, isi) => isi && bagian.push([judul, isi])
  const pertemuan = <TabelPertemuan d={d} kurikulum={kurikulum} />
  const adaPertemuan = (d.pertemuan || []).some((p) => TAHAP[kurikulum].some((t) => teksPolos(p.tahap?.[t.k]?.isi)))

  const tujuan = [
    htmlField({ k: 'kompetensi_dasar', label: 'Kompetensi Dasar (KD)' }),
    htmlField({ k: 'tujuan_pembelajaran', label: 'Tujuan Pembelajaran' }),
    d.kkm && (
      <Butir key="kkm" label="Kriteria Ketuntasan Minimal (KKM)">
        <p className="text-sm">{d.kkm}</p>
      </Butir>
    ),
  ].filter(Boolean)
  tambah('Tujuan Pembelajaran', tujuan.length > 0 && tujuan)
  tambah(
    'Langkah-Langkah Pembelajaran',
    (d.model_pembelajaran || adaPertemuan) && (
      <>
        {d.model_pembelajaran && (
          <Butir label="Model Pembelajaran">
            <p className="text-sm">{d.model_pembelajaran}</p>
          </Butir>
        )}
        {pertemuan}
      </>
    )
  )
  const nilai = FIELD.k13.asesmen.map(htmlField).filter(Boolean)
  tambah('Penilaian Pembelajaran', nilai.length > 0 && nilai)
  tambah(
    'Lampiran',
    modul.lampiran?.length > 0 && <Daftar isi={modul.lampiran.map((l) => `${JENIS_LAMPIRAN[l.jenis] || 'Lampiran'}: ${l.nama_file}`)} />
  )

  return (
    <article className="bg-white text-slate-900">
      <header className="text-center">
        <p className="text-base font-extrabold tracking-wide">RENCANA PELAKSANAAN PEMBELAJARAN (RPP)</p>
        <p className="text-sm text-slate-600">{KURIKULUM_META[kurikulum].label}</p>
        <p className="text-sm font-bold uppercase mt-0.5">{modul.judul || '(Tanpa judul)'}</p>
      </header>
      <div className="mt-4">
        <TabelInfo baris={baris} lebarLabel="whitespace-nowrap" />
      </div>
      {bagian.map(([judul, isi], i) => (
        <Bagian key={judul} judul={`${String.fromCharCode(65 + i)}. ${judul}`}>
          {isi}
        </Bagian>
      ))}
      {bagian.length === 0 && <p className="mt-6 text-sm text-slate-400 italic">Belum ada isian.</p>}
    </article>
  )
}
