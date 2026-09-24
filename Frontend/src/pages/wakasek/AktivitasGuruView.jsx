import { useEffect, useState } from 'react'
import { Badge, Field, Kartu, Kosong, Pesan } from '../../components/PpdbUI'
import { selectClass, tgl } from '../../components/ppdbKonstanta'
import { api } from '../../lib/api'
import { Halaman, PeriodeFilter, Persen } from './WakasekUI'
import { periodeBulanIni, td, th } from './wakasekKonstanta'

/** Aktivitas guru pada periode: kehadiran, penggantian, dan materi/tugas/ujian/nilai yang dicatat di sistem. */
export default function AktivitasGuruView({ onBack }) {
  const [periode, setPeriode] = useState(periodeBulanIni())
  const [search, setSearch] = useState('')
  const [hanyaPerhatian, setHanyaPerhatian] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let batal = false
    const t = setTimeout(() => {
      api
        .wakAktivitasGuru({ ...periode, ...(search ? { search } : {}) })
        .then((r) => !batal && (setData(r), setError('')))
        .catch((e) => !batal && setError(e.message))
    }, 250)
    return () => {
      batal = true
      clearTimeout(t)
    }
  }, [periode, search])

  const daftar = (data?.daftar ?? []).filter((g) => !hanyaPerhatian || g.perlu_perhatian)
  const r = data?.ringkasan

  return (
    <Halaman judul="Aktivitas Guru" deskripsi="Ringkasan aktivitas guru yang tercatat di sistem. Penanda “perlu perhatian” hanya bahan tindak lanjut, bukan penilaian kinerja." onBack={onBack}>
      <div className="bg-white border border-navy/10 rounded-2xl p-4 mb-4 flex items-end gap-4 flex-wrap">
        <PeriodeFilter nilai={periode} onChange={setPeriode} />
        <Field label="Cari guru">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nama guru…" className={`${selectClass} w-52`} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-navy pb-2">
          <input type="checkbox" checked={hanyaPerhatian} onChange={(e) => setHanyaPerhatian(e.target.checked)} /> Hanya yang perlu perhatian
        </label>
      </div>
      <Pesan error={error} />
      {r && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Kartu tone="hijau" label="Guru aktif" nilai={r.guru} sub={`${r.aktif_mencatat} mencatat aktivitas`} />
          <Kartu tone="oranye" label="Perlu perhatian" nilai={r.perlu_perhatian} sub="ada jadwal, belum ada catatan" />
          <Kartu tone="biru" label="Materi · Tugas · Ujian" nilai={`${r.materi} · ${r.tugas} · ${r.ujian}`} sub="dibuat pada periode" />
          <Kartu tone="teal" label="Nilai diinput" nilai={r.nilai} sub="pada periode" />
        </div>
      )}
      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : daftar.length === 0 ? (
        <Kosong>Tidak ada guru yang cocok.</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy/5">
              <tr>
                <th className={th}>Guru</th>
                <th className={th}>Sesi/minggu</th>
                <th className={th}>Kehadiran</th>
                <th className={th}>Berhalangan / menggantikan</th>
                <th className={th}>Materi</th>
                <th className={th}>Tugas</th>
                <th className={th}>Ujian</th>
                <th className={th}>Nilai</th>
                <th className={th}>Terakhir aktif</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {daftar.map((g) => (
                <tr key={g.guru_id}>
                  <td className={`${td} font-semibold`}>{g.nama}</td>
                  <td className={`${td} tabular-nums`}>{g.sesi_per_minggu}</td>
                  <td className={td}>
                    <Persen nilai={g.kehadiran_persen} />
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {g.berhalangan} / {g.menggantikan}
                  </td>
                  <td className={`${td} tabular-nums`}>{g.materi}</td>
                  <td className={`${td} tabular-nums`}>{g.tugas}</td>
                  <td className={`${td} tabular-nums`}>{g.ujian}</td>
                  <td className={`${td} tabular-nums`}>{g.nilai}</td>
                  <td className={td}>{g.terakhir_aktif ? tgl(g.terakhir_aktif) : '-'}</td>
                  <td className={td}>{g.perlu_perhatian && <Badge tone="kuning">Perlu perhatian</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Halaman>
  )
}
