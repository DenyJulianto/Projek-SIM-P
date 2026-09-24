import { useEffect, useState } from 'react'
import { Field, Kartu, Kosong, Pesan } from '../../components/PpdbUI'
import { selectClass, tgl } from '../../components/ppdbKonstanta'
import { api } from '../../lib/api'
import { Halaman, PeriodeFilter, Persen } from './WakasekUI'
import { periodeBulanIni, td, th } from './wakasekKonstanta'

/** Rekap kehadiran siswa (per rombel) dan guru & tendik (per orang) pada periode, lengkap dengan tren harian. */
export default function RekapKehadiranView({ onBack }) {
  const [periode, setPeriode] = useState(periodeBulanIni())
  const [kelasId, setKelasId] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let batal = false
    api
      .wakRekapKehadiran({ ...periode, ...(kelasId ? { kelas_id: kelasId } : {}) })
      .then((r) => !batal && (setData(r), setError('')))
      .catch((e) => !batal && setError(e.message))
    return () => {
      batal = true
    }
  }, [periode, kelasId])

  const s = data?.siswa.total
  const g = data?.guru.total

  return (
    <Halaman judul="Rekap Kehadiran" deskripsi="Rekap kehadiran siswa dan guru & tendik dari data absensi yang sudah tercatat." onBack={onBack}>
      <div className="bg-white border border-navy/10 rounded-2xl p-4 mb-4 flex items-end gap-4 flex-wrap">
        <PeriodeFilter nilai={periode} onChange={setPeriode} />
        <Field label="Rombel (untuk siswa)">
          <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className={selectClass}>
            <option value="">Semua rombel</option>
            {data?.kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Pesan error={error} />
      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kartu tone="hijau" label="Kehadiran siswa" nilai={s.persen === null ? '-' : `${s.persen}%`} sub={`${s.hadir} hadir dari ${s.total} catatan`} />
            <Kartu tone="oranye" label="Siswa tidak hadir" nilai={s.sakit + s.izin + s.alpha} sub={`Sakit ${s.sakit} · Izin ${s.izin} · Alpha ${s.alpha}`} />
            <Kartu tone="biru" label="Kehadiran guru & tendik" nilai={g.persen === null ? '-' : `${g.persen}%`} sub={`${g.hadir} hadir dari ${g.total} catatan`} />
            <Kartu tone="merah" label="Guru tidak hadir" nilai={g.sakit + g.izin + g.alpha} sub={`Sakit ${g.sakit} · Izin ${g.izin} · Alpha ${g.alpha}`} />
          </div>

          <Tren data={data.harian} />

          <div className="grid xl:grid-cols-2 gap-5">
            <div>
              <h2 className="text-sm font-extrabold text-navy mb-2">Kehadiran siswa per rombel</h2>
              <Tabel
                kolom={['Rombel', 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Kehadiran']}
                baris={data.siswa.per_kelas.map((k) => [k.kelas, k.hadir, k.sakit, k.izin, k.alpha, <Persen key="p" nilai={k.persen} />])}
                kosong="Belum ada rombel."
              />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-navy mb-2">Kehadiran guru & tendik</h2>
              <Tabel
                kolom={['Nama', 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Kehadiran']}
                baris={data.guru.per_guru.map((k) => [k.nama, k.hadir, k.sakit, k.izin, k.alpha, <Persen key="p" nilai={k.persen} />])}
                kosong="Belum ada guru aktif."
              />
            </div>
          </div>
        </div>
      )}
    </Halaman>
  )
}

function Tabel({ kolom, baris, kosong }) {
  if (baris.length === 0) return <Kosong>{kosong}</Kosong>
  return (
    <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
      <table className="w-full">
        <thead className="bg-navy/5">
          <tr>
            {kolom.map((k) => (
              <th key={k} className={th}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {baris.map((b, i) => (
            <tr key={i}>
              {b.map((c, j) => (
                <td key={j} className={`${td} ${j === 0 ? 'font-semibold' : 'tabular-nums'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Tren harian: dua deret batang (siswa hijau, guru biru) per tanggal yang punya catatan absensi. */
function Tren({ data }) {
  if (data.length === 0) return null
  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-4">
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <h2 className="text-sm font-extrabold text-navy">Tren kehadiran harian</h2>
        <span className="flex items-center gap-1.5 text-[11px] text-navy/60">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Siswa
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-navy/60">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> Guru & tendik
        </span>
      </div>
      <div className="flex items-end gap-2 h-40 overflow-x-auto pb-1">
        {data.map((h) => (
          <div key={h.tanggal} className="flex flex-col items-center justify-end h-full min-w-10 flex-1" title={`${tgl(h.tanggal)} — siswa ${h.siswa ?? '-'}%, guru ${h.guru ?? '-'}%`}>
            <div className="flex items-end gap-0.5 h-full w-full justify-center">
              <div className="w-2.5 rounded-t bg-emerald-500" style={{ height: `${h.siswa ?? 0}%`, opacity: h.siswa === null ? 0.15 : 1 }} />
              <div className="w-2.5 rounded-t bg-sky-500" style={{ height: `${h.guru ?? 0}%`, opacity: h.guru === null ? 0.15 : 1 }} />
            </div>
            <span className="text-[10px] text-navy/50 mt-1">{h.tanggal.slice(8)}/{h.tanggal.slice(5, 7)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
