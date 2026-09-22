import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Btn, Kosong, Pesan } from './PpdbUI'
import { LABEL_EVENT, selectClass, waktu } from './ppdbKonstanta'

const PENTING = ['verifikasi', 'seleksi', 'seleksi_nilai', 'pengumuman', 'penerimaan', 'import']
const NADA = { verifikasi: 'bg-emerald-100 text-emerald-700', seleksi: 'bg-sky-100 text-sky-700', seleksi_nilai: 'bg-sky-100 text-sky-700', pengumuman: 'bg-violet-100 text-violet-700', penerimaan: 'bg-teal-100 text-teal-700', import: 'bg-teal-100 text-teal-700' }

function nilaiTampil(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'ya' : 'tidak'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** Menampilkan satu sisi (sebelum/sesudah); kolom yang berbeda dari sisi lawannya ditebalkan. */
function Sisi({ data, lawan, tone }) {
  if (!data) return <span className="text-navy/30">—</span>
  return (
    <ul className="space-y-0.5">
      {Object.entries(data).map(([k, v]) => {
        const beda = lawan ? nilaiTampil(lawan[k]) !== nilaiTampil(v) : false
        return (
          <li key={k} className="text-xs break-words">
            <span className="text-navy/40">{k.replaceAll('_', ' ')}: </span>
            <span className={beda ? `font-bold ${tone}` : 'text-navy/70'}>{nilaiTampil(v)}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default function PpdbAuditTab({ periode }) {
  const [filter, setFilter] = useState({ event: '', pengguna_id: '', dari: '', sampai: '', search: '' })
  const [halaman, setHalaman] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const muat = useCallback(
    () =>
      api
        .ppdbAudit({ periode_id: periode.id, page: halaman, per_page: 25, ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)) })
        .then((r) => {
          setData(r)
          setError('')
        })
        .catch((e) => setError(e.message)),
    [periode.id, filter, halaman],
  )
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat()
  }, [muat])

  const set = (k, v) => {
    setHalaman(1)
    setFilter((f) => ({ ...f, [k]: v }))
  }

  return (
    <div className="space-y-3">
      <Pesan error={error} />
      <p className="text-xs text-navy/50">Setiap perubahan penting PPDB dicatat otomatis: siapa, kapan, apa yang dilakukan, serta data sebelum dan sesudahnya. Catatan ini tidak dapat diubah dari aplikasi.</p>

      <div className="flex items-center gap-2 flex-wrap">
        <input value={filter.search} onChange={(e) => set('search', e.target.value)} placeholder="Cari di deskripsi (nama/nomor)…" className={`${selectClass} w-60`} />
        <select value={filter.event} onChange={(e) => set('event', e.target.value)} className={selectClass}>
          <option value="">Semua tindakan</option>
          {(data?.opsi.tindakan ?? []).map((t) => (
            <option key={t} value={t}>
              {LABEL_EVENT[t] ?? t}
            </option>
          ))}
        </select>
        <select value={filter.pengguna_id} onChange={(e) => set('pengguna_id', e.target.value)} className={selectClass}>
          <option value="">Semua pengguna</option>
          {(data?.opsi.pengguna ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-navy/50">
          Dari <input type="date" value={filter.dari} onChange={(e) => set('dari', e.target.value)} className={selectClass} />
        </label>
        <label className="flex items-center gap-1 text-xs text-navy/50">
          Sampai <input type="date" value={filter.sampai} onChange={(e) => set('sampai', e.target.value)} className={selectClass} />
        </label>
        {Object.values(filter).some(Boolean) && (
          <button
            onClick={() => {
              setHalaman(1)
              setFilter({ event: '', pengguna_id: '', dari: '', sampai: '', search: '' })
            }}
            className="text-xs font-semibold text-navy/60 hover:text-navy"
          >
            Reset
          </button>
        )}
      </div>

      {!data ? (
        <Kosong>Memuat audit trail…</Kosong>
      ) : (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                {['Waktu', 'Pengguna', 'Tindakan', 'Data Sebelum', 'Data Sesudah'].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-xs text-navy/40">
                    Tidak ada catatan yang sesuai.
                  </td>
                </tr>
              )}
              {data.data.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-navy/70">{waktu(r.waktu)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <p className="font-semibold text-navy text-xs">{r.pengguna}</p>
                    {r.ip && <p className="text-[10px] text-navy/40">{r.ip}</p>}
                  </td>
                  <td className="px-3 py-2 min-w-64">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${NADA[r.tindakan] ?? 'bg-navy/10 text-navy/70'}`}>
                      {LABEL_EVENT[r.tindakan] ?? r.tindakan}
                      {PENTING.includes(r.tindakan) ? ' ★' : ''}
                    </span>
                    <p className="text-[11px] text-navy/50 mt-1">{r.objek}</p>
                    <p className="text-sm text-navy mt-0.5">{r.deskripsi}</p>
                    {r.catatan && <p className="text-xs text-navy/60 mt-0.5">Catatan/alasan: {r.catatan}</p>}
                  </td>
                  <td className="px-3 py-2 min-w-40">
                    <Sisi data={r.sebelum} lawan={r.sesudah} tone="text-red-600" />
                  </td>
                  <td className="px-3 py-2 min-w-40">
                    <Sisi data={r.sesudah} lawan={r.sebelum} tone="text-emerald-700" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-3 py-2 border-t border-navy/5 text-xs text-navy/50">
            <span>{data.total} catatan · ★ = tindakan penting (verifikasi, seleksi, pengumuman, penerimaan)</span>
            <div className="flex items-center gap-2">
              <Btn kecil disabled={data.current_page <= 1} onClick={() => setHalaman((h) => h - 1)}>
                ‹
              </Btn>
              <span>
                {data.current_page} / {data.last_page}
              </span>
              <Btn kecil disabled={data.current_page >= data.last_page} onClick={() => setHalaman((h) => h + 1)}>
                ›
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
