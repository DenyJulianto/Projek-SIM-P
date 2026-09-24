import { useEffect, useState } from 'react'
import { Badge, Field, Kartu, Kosong, Pesan } from '../../components/PpdbUI'
import { selectClass } from '../../components/ppdbKonstanta'
import { api } from '../../lib/api'
import { Halaman } from './WakasekUI'
import { td, th } from './wakasekKonstanta'

/** Data guru & tenaga kependidikan (baca saja). Pengelolaan data tetap dilakukan Tata Usaha. */
export default function DataGuruTendikView({ onBack }) {
  const [f, setF] = useState({ search: '', status: '', jabatan: '' })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .wakGuruTendik(Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '')))
        .then((r) => (setData(r), setError('')))
        .catch((e) => setError(e.message))
    }, 250)
    return () => clearTimeout(t)
  }, [f])

  const r = data?.ringkasan
  return (
    <Halaman judul="Data Guru & Tendik" deskripsi="Tampilan baca saja — penambahan dan perubahan data dilakukan oleh Tata Usaha." onBack={onBack}>
      <Pesan error={error} />
      {r && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Kartu tone="hijau" label="Total guru & tendik" nilai={r.total} />
          <Kartu tone="teal" label="Aktif" nilai={r.aktif} />
          <Kartu tone="oranye" label="Nonaktif" nilai={r.nonaktif} />
          <div className="rounded-2xl border border-navy/10 bg-white p-4">
            <p className="text-xs text-navy/60 mb-1.5">Berdasarkan status kepegawaian</p>
            <div className="flex flex-wrap gap-1.5">
              {r.per_status_kepegawaian.map((s) => (
                <span key={s.label} className="text-[11px] bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 font-semibold">
                  {s.label} · {s.jumlah}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex items-end gap-3 flex-wrap mb-3">
        <Field label="Pencarian">
          <input value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} placeholder="Nama, NIP, NUPTK, mata pelajaran…" className={`${selectClass} w-64`} />
        </Field>
        <Field label="Jabatan">
          <select value={f.jabatan} onChange={(e) => setF({ ...f, jabatan: e.target.value })} className={selectClass}>
            <option value="">Semua</option>
            {data?.jabatan.map((j) => (
              <option key={j}>{j}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={selectClass}>
            <option value="">Semua</option>
            {data?.status.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      {!data ? (
        <Kosong>Memuat…</Kosong>
      ) : data.daftar.length === 0 ? (
        <Kosong>Tidak ada data yang cocok.</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy/5">
              <tr>
                <th className={th}>Nama</th>
                <th className={th}>NIP / NUPTK</th>
                <th className={th}>Jabatan</th>
                <th className={th}>Status kepegawaian</th>
                <th className={th}>Mata pelajaran</th>
                <th className={th}>Kelas</th>
                <th className={th}>Sesi/minggu</th>
                <th className={th}>Kontak</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {data.daftar.map((g) => (
                <tr key={g.id}>
                  <td className={`${td} font-semibold`}>{g.nama}</td>
                  <td className={td}>
                    {g.nip || '-'}
                    {g.nuptk && <span className="block text-[11px] text-navy/40">{g.nuptk}</span>}
                  </td>
                  <td className={td}>{g.jabatan || '-'}</td>
                  <td className={td}>{g.status_kepegawaian || '-'}</td>
                  <td className={td}>{g.mata_pelajaran || '-'}</td>
                  <td className={`${td} tabular-nums`}>{g.kelas}</td>
                  <td className={`${td} tabular-nums`}>{g.sesi_per_minggu}</td>
                  <td className={td}>{g.no_telepon || '-'}</td>
                  <td className={td}>
                    <Badge tone={g.status === 'aktif' ? 'hijau' : 'abu'}>{g.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Halaman>
  )
}
