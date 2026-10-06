import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import SemesterFormModal from './SemesterFormModal'
import TahunAjaranFormModal from './TahunAjaranFormModal'

/**
 * Kelola tahun ajaran & semester. Dipakai di Konfigurasi Sistem (Admin)
 * dan di dasbor Kurikulum, yang juga menjadi pengelola data akademik ini.
 */
export default function TahunAjaranSemesterPanel() {
  const [tahunAjaran, setTahunAjaran] = useState([])
  const [semester, setSemester] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTahun, setEditingTahun] = useState(null)
  const [showTahunForm, setShowTahunForm] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)
  const [showSemesterForm, setShowSemesterForm] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([api.listTahunAjaran(), api.listSemester()])
      .then(([t, s]) => {
        setTahunAjaran(t)
        setSemester(s)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDeleteTahun(item) {
    if (!window.confirm(`Hapus tahun ajaran "${item.nama}"?`)) return
    try {
      await api.deleteTahunAjaran(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleDeleteSemester(item) {
    if (!window.confirm(`Hapus semester "${item.nama}"?`)) return
    try {
      await api.deleteSemester(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  if (loading) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide">Tahun Ajaran</h3>
          <button
            onClick={() => {
              setEditingTahun(null)
              setShowTahunForm(true)
            }}
            className="text-xs font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-3.5 py-1.5"
          >
            + Tambah
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
          {tahunAjaran.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-6">Belum ada tahun ajaran.</p>
          ) : (
            tahunAjaran.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy flex items-center gap-2">
                    {t.nama}
                    {t.is_active && (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-navy/40">
                    {t.tanggal_mulai?.slice(0, 10)} — {t.tanggal_selesai?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTahun(t)
                      setShowTahunForm(true)
                    }}
                    className="text-xs text-navy/60 hover:text-navy px-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTahun(t)}
                    className="text-xs text-red-500 hover:text-red-700 px-2"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide">Semester</h3>
          <button
            onClick={() => {
              if (tahunAjaran.length === 0) {
                window.alert('Tambahkan tahun ajaran terlebih dahulu.')
                return
              }
              setEditingSemester(null)
              setShowSemesterForm(true)
            }}
            className="text-xs font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-3.5 py-1.5"
          >
            + Tambah
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
          {semester.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-6">Belum ada semester.</p>
          ) : (
            semester.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy flex items-center gap-2">
                    {s.nama} — {s.tahun_ajaran?.nama}
                    {s.is_active && (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-navy/40">
                    {s.tanggal_mulai?.slice(0, 10)} — {s.tanggal_selesai?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingSemester(s)
                      setShowSemesterForm(true)
                    }}
                    className="text-xs text-navy/60 hover:text-navy px-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSemester(s)}
                    className="text-xs text-red-500 hover:text-red-700 px-2"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showTahunForm && (
        <TahunAjaranFormModal
          item={editingTahun}
          onClose={() => setShowTahunForm(false)}
          onSaved={() => {
            setShowTahunForm(false)
            load()
          }}
        />
      )}

      {showSemesterForm && (
        <SemesterFormModal
          item={editingSemester}
          tahunAjaranList={tahunAjaran}
          onClose={() => setShowSemesterForm(false)}
          onSaved={() => {
            setShowSemesterForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}
