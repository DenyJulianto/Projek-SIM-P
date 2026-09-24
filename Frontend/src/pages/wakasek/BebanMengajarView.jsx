import { useEffect, useState } from 'react'
import { Btn, Field, Kartu, Kosong, Pesan } from '../../components/PpdbUI'
import { selectClass } from '../../components/ppdbKonstanta'
import { api } from '../../lib/api'
import { Halaman } from './WakasekUI'
import { td, th } from './wakasekKonstanta'

const STATUS = { draft: 'Draft', aktif: 'Aktif', nonaktif: 'Nonaktif' }

/** Beban mengajar per guru (total JP per minggu) dari Pembagian Mata Pelajaran, dengan batas beban yang dapat diatur. */
export default function BebanMengajarView({ onBack }) {
  const [tahun, setTahun] = useState([])
  const [tahunId, setTahunId] = useState('')
  const [semester, setSemester] = useState('ganjil')
  const [batas, setBatas] = useState(24)
  const [data, setData] = useState(null)
  const [buka, setBuka] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getOpsiPembagianMapel()
      .then((o) => {
        setTahun(o.tahun_ajaran)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        if (aktif) setTahunId(String(aktif.id))
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!tahunId) return
    let batal = false
    const t = setTimeout(() => {
      api
        .getBebanPembagianMapel({ tahun_ajaran_id: tahunId, semester, batas_jp: batas || 24 })
        .then((r) => !batal && (setData(r), setError('')))
        .catch((e) => !batal && setError(e.message))
    }, 300)
    return () => {
      batal = true
      clearTimeout(t)
    }
  }, [tahunId, semester, batas])

  const guru = data?.guru ?? []
  const mengajar = guru.filter((g) => g.total_jp > 0)
  const rata = mengajar.length ? Math.round(mengajar.reduce((n, g) => n + g.total_jp, 0) / mengajar.length) : null

  return (
    <Halaman judul="Beban Mengajar" deskripsi="Total jam pelajaran (JP) per minggu tiap guru, dihitung dari Pembagian Mata Pelajaran yang tidak nonaktif." onBack={onBack}>
      <div className="flex items-end gap-3 flex-wrap mb-4">
        <Field label="Tahun ajaran">
          <select value={tahunId} onChange={(e) => setTahunId(e.target.value)} className={selectClass}>
            {tahun.length === 0 && <option value="">Belum ada</option>}
            {tahun.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Semester">
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className={selectClass}>
            <option value="ganjil">Ganjil</option>
            <option value="genap">Genap</option>
          </select>
        </Field>
        <Field label="Batas beban (JP/minggu)" hint="Hanya penanda sesuai kebijakan sekolah.">
          <input type="number" min="1" max="100" value={batas} onChange={(e) => setBatas(Number(e.target.value))} className={`${selectClass} w-24`} />
        </Field>
      </div>
      <Pesan error={error} />
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Kartu tone="hijau" label="Guru mengampu" nilai={mengajar.length} sub={`dari ${guru.length} guru & tendik`} />
          <Kartu tone="biru" label="Rata-rata JP / minggu" nilai={rata ?? '-'} sub="guru yang mengampu" />
          <Kartu tone="oranye" label="Melebihi batas" nilai={guru.filter((g) => g.melebihi_batas).length} sub={`> ${data.batas_jp} JP`} />
          <Kartu tone="teal" label="Belum mengampu" nilai={guru.length - mengajar.length} sub="belum ada pembagian" />
        </div>
      )}
      {!data ? (
        <Kosong>{tahunId ? 'Memuat…' : 'Tambahkan Tahun Ajaran terlebih dahulu.'}</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy/5">
              <tr>
                <th className={th}>Guru</th>
                <th className={th}>Total JP / minggu</th>
                <th className={th}>Rombel</th>
                <th className={th}>Mata pelajaran</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {guru.map((g) => (
                <BarisBeban key={g.guru_id} g={g} batas={data.batas_jp} terbuka={buka === g.guru_id} onToggle={() => setBuka(buka === g.guru_id ? null : g.guru_id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Halaman>
  )
}

function BarisBeban({ g, batas, terbuka, onToggle }) {
  const persen = Math.min(100, Math.round((g.total_jp / batas) * 100))
  return (
    <>
      <tr>
        <td className={`${td} font-semibold`}>{g.nama}</td>
        <td className={`${td} min-w-44`}>
          <span className={g.melebihi_batas ? 'text-amber-700 font-semibold' : ''}>
            {g.total_jp} / {batas}
            {g.melebihi_batas ? ' (melebihi)' : ''}
          </span>
          <div className="h-1.5 bg-navy/10 rounded-full mt-1 overflow-hidden">
            <div className={`h-full ${g.melebihi_batas ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${persen}%` }} />
          </div>
        </td>
        <td className={`${td} tabular-nums`}>{g.jumlah_rombel}</td>
        <td className={`${td} tabular-nums`}>{g.jumlah_mapel}</td>
        <td className={td}>
          {g.rincian.length > 0 && (
            <Btn kecil onClick={onToggle}>
              {terbuka ? 'Tutup' : 'Rincian'}
            </Btn>
          )}
        </td>
      </tr>
      {terbuka && (
        <tr className="bg-navy/[0.02]">
          <td colSpan={5} className="px-4 py-2">
            <ul className="text-xs text-navy/70 space-y-0.5">
              {g.rincian.map((r) => (
                <li key={r.id}>
                  {r.rombel} — {r.mata_pelajaran}: {r.alokasi_jp} JP ({STATUS[r.status] ?? r.status})
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}
