import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckIcon },
  { value: 'izin', label: 'Izin', tone: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon },
  { value: 'sakit', label: 'Sakit', tone: 'bg-red-50 text-red-600 border-red-200', icon: CrossIcon },
  { value: 'alpha', label: 'Alfa', tone: 'bg-navy/5 text-navy/50 border-navy/10', icon: DashIcon },
]

function statusInfo(value) {
  return STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[0]
}

export default function KehadiranGuruMapel({ onBack }) {
  const [kelasList, setKelasList] = useState(null)
  const [kelas, setKelas] = useState(null)
  const [siswaList, setSiswaList] = useState(null)
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState({})
  const [keterangan, setKeterangan] = useState({})
  const [editingKet, setEditingKet] = useState(() => new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api
      .getMyGuruKelas()
      .then((r) => {
        setKelasList(r)
        if (r.length > 0) setKelas(r[0])
      })
      .catch(() => setKelasList([]))
  }, [])

  function resetDefault(data) {
    setStatus(Object.fromEntries(data.map((s) => [s.id, 'hadir'])))
    setKeterangan(Object.fromEntries(data.map((s) => [s.id, ''])))
    setEditingKet(new Set())
  }

  useEffect(() => {
    if (!kelas) return
    setSiswaList(null)
    api.listSiswaByKelas(kelas.id).then((r) => {
      setSiswaList(r.data)
      resetDefault(r.data)
    }).catch(() => setSiswaList([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  async function handleTampilkan() {
    if (!kelas || !siswaList) return
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const existing = await api.listAbsensiSiswa({
        'filter[kelas_id]': kelas.id,
        'filter[tanggal]': tanggal,
        per_page: 200,
      })
      const bySiswa = new Map((existing.data ?? existing).map((a) => [a.siswa_id, a]))
      setStatus(Object.fromEntries(siswaList.map((s) => [s.id, bySiswa.get(s.id)?.status ?? 'hadir'])))
      setKeterangan(Object.fromEntries(siswaList.map((s) => [s.id, bySiswa.get(s.id)?.keterangan ?? ''])))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function editKeterangan(siswaId) {
    setEditingKet((prev) => new Set(prev).add(siswaId))
  }

  function selesaiKeterangan(siswaId) {
    setEditingKet((prev) => {
      const next = new Set(prev)
      next.delete(siswaId)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const items = (siswaList || []).map((s) => ({
        siswa_id: s.id,
        kelas_id: kelas.id,
        status: status[s.id] || 'hadir',
        keterangan: keterangan[s.id] || null,
      }))
      await api.bulkSaveAbsensiSiswa(tanggal, items)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const rekap = STATUS_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = Object.values(status).filter((v) => v === opt.value).length
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy inline-flex items-center gap-1.5">
        <span aria-hidden>←</span> Kembali ke Dashboard
      </button>

      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-wrap items-end gap-5">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <label className="block">
            <span className="block text-xs font-semibold text-navy/50 mb-1">Tanggal</span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="border border-navy/10 rounded-lg px-3 py-1.5 text-sm text-navy focus:outline-none focus:border-emerald-400"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <UsersGroupIcon className="h-5 w-5" />
          </span>
          <label className="block">
            <span className="block text-xs font-semibold text-navy/50 mb-1">Kelas</span>
            <select
              value={kelas?.id ?? ''}
              onChange={(e) => setKelas(kelasList.find((k) => k.id === Number(e.target.value)) ?? null)}
              className="border border-navy/10 rounded-lg px-3 py-1.5 text-sm text-navy bg-white focus:outline-none focus:border-emerald-400"
            >
              {(kelasList || []).length === 0 && <option value="">-</option>}
              {(kelasList || []).map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={handleTampilkan}
          disabled={loading || !siswaList}
          className="ml-auto inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <SearchIcon className="h-4 w-4" />
          {loading ? 'Memuat...' : 'Tampilkan'}
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <StudentIcon className="h-4 w-4 text-navy/60" />
            Daftar Kehadiran Siswa
          </h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <span
                  key={opt.value}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${opt.tone}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label} {rekap[opt.value] ?? 0}
                </span>
              )
            })}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-emerald-600 text-sm mb-3">Absensi berhasil disimpan.</p>}

        {(kelasList === null || siswaList === null) && kelas !== null && <EmptyState text="Memuat..." />}
        {kelasList !== null && kelas === null && <EmptyState text="Belum ada kelas yang Anda ampu." />}
        {kelas && siswaList !== null && siswaList.length === 0 && <EmptyState text="Belum ada siswa di kelas ini." />}

        {siswaList !== null && siswaList.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-navy/45 border-b border-navy/10">
                    <th className="py-3 pr-3 w-10">No</th>
                    <th className="py-3 pr-3">Nama Siswa</th>
                    <th className="py-3 pr-3">Kelas</th>
                    <th className="py-3 pr-3">Status Kehadiran</th>
                    <th className="py-3 pr-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {siswaList.map((s, i) => {
                    const current = statusInfo(status[s.id])
                    return (
                      <tr key={s.id} className="hover:bg-navy/[0.02]">
                        <td className="py-3 pr-3 text-navy/50">{i + 1}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <span className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {inisial(s.nama)}
                            </span>
                            <span className="font-semibold text-navy">{s.nama}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-navy/60">{kelas?.nama_kelas ?? '-'}</td>
                        <td className="py-3 pr-3">
                          <div className="relative inline-block">
                            <select
                              value={status[s.id] || 'hadir'}
                              onChange={(e) => {
                                const v = e.target.value
                                setStatus((prev) => ({ ...prev, [s.id]: v }))
                                if (v === 'hadir') {
                                  setKeterangan((prev) => ({ ...prev, [s.id]: '' }))
                                } else {
                                  editKeterangan(s.id)
                                }
                              }}
                              className={`appearance-none pl-7 pr-7 py-1.5 rounded-full text-xs font-semibold border focus:outline-none ${current.tone}`}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <current.icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                            <ChevronIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          {status[s.id] && status[s.id] !== 'hadir' ? (
                            editingKet.has(s.id) || !keterangan[s.id] ? (
                              <input
                                autoFocus={editingKet.has(s.id)}
                                value={keterangan[s.id] || ''}
                                onChange={(e) => setKeterangan((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                onBlur={() => selesaiKeterangan(s.id)}
                                onKeyDown={(e) => e.key === 'Enter' && selesaiKeterangan(s.id)}
                                placeholder="Masukkan keterangan..."
                                className="w-full min-w-[160px] border border-navy/10 rounded-lg px-3 py-1.5 text-xs text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
                              />
                            ) : (
                              <button
                                onClick={() => editKeterangan(s.id)}
                                title="Klik untuk mengubah keterangan"
                                className="inline-flex items-center gap-1.5 text-xs text-navy/70 hover:text-navy hover:underline text-left group"
                              >
                                {keterangan[s.id]}
                                <PencilIcon className="h-3 w-3 text-navy/30 group-hover:text-navy/60 shrink-0" />
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-navy/30">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-navy/5 flex-wrap gap-3">
              <p className="text-xs text-navy/40 italic">
                Bersama kita wujudkan lingkungan belajar yang lebih baik 💚
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? 'Menyimpan...' : 'Simpan Kehadiran'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-sm text-navy/40 text-center py-10">{text}</p>
}

function UsersGroupIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="19" cy="10" r="2" />
      <path d="M1.5 18c0-2 1.5-3.5 3.5-3.5M22.5 18c0-2-1.5-3.5-3.5-3.5" />
    </svg>
  )
}

function SearchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}

function ClockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function CrossIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function DashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 12h12" />
    </svg>
  )
}

function SaveIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11l3 3v13H5Z" />
      <path d="M8 4v5h8V4M8 14h8v6H8Z" />
    </svg>
  )
}

function StudentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  )
}

function inisial(nama) {
  return (nama || '?').trim().charAt(0).toUpperCase()
}

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}

function PencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function ChevronIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
