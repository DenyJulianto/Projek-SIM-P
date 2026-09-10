import { useEffect, useState } from 'react'
import JadwalFormModal from '../components/JadwalFormModal'
import { api } from '../lib/api'

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function ScheduleManagement({ onBack }) {
  const [jadwal, setJadwal] = useState([])
  const [kelasList, setKelasList] = useState([])
  const [guruList, setGuruList] = useState([])
  const [mapelList, setMapelList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingJadwal, setEditingJadwal] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function loadJadwal() {
    setLoading(true)
    api
      .listJadwal()
      .then((res) => setJadwal(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadJadwal()
    api.listKelasAll().then((r) => setKelasList(r.data)).catch(() => {})
    api.listGuruAll().then((r) => setGuruList(r.data)).catch(() => {})
    api.listMataPelajaran().then((r) => setMapelList(r.data)).catch(() => {})
  }, [])

  function openEdit(item) {
    setEditingJadwal(item)
    setShowForm(true)
  }

  function openCreate() {
    setEditingJadwal(null)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    loadJadwal()
  }

  async function handleDelete(item) {
    if (!window.confirm('Hapus jadwal ini?')) return
    try {
      await api.deleteJadwal(item.id)
      loadJadwal()
    } catch (err) {
      setError(err.message)
    }
  }

  const grouped = HARI_ORDER.map((hari) => ({
    hari,
    items: jadwal
      .filter((j) => j.hari === hari)
      .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Jadwal Pelajaran</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Tambah Jadwal
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-navy/40 text-sm">Memuat...</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ hari, items }) => (
            <div key={hari}>
              <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">
                {hari}
              </h2>
              {items.length === 0 ? (
                <p className="text-navy/30 text-sm">Belum ada jadwal.</p>
              ) : (
                <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                        <th className="px-4 py-2">Jam</th>
                        <th className="px-4 py-2">Kelas</th>
                        <th className="px-4 py-2">Mata Pelajaran</th>
                        <th className="px-4 py-2">Guru</th>
                        <th className="px-4 py-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t border-navy/5">
                          <td className="px-4 py-2 text-navy/70">
                            {item.jam_mulai?.slice(0, 5)} - {item.jam_selesai?.slice(0, 5)}
                          </td>
                          <td className="px-4 py-2 text-navy/70">{item.kelas?.nama_kelas}</td>
                          <td className="px-4 py-2 text-navy/70">
                            {item.mata_pelajaran?.nama_mapel}
                          </td>
                          <td className="px-4 py-2 text-navy/70">{item.guru?.nama}</td>
                          <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => openEdit(item)}
                              className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-600 hover:text-white transition-colors"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <JadwalFormModal
          jadwal={editingJadwal}
          kelasList={kelasList}
          guruList={guruList}
          mapelList={mapelList}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          onMapelAdded={(mapel) => setMapelList((prev) => [...prev, mapel])}
        />
      )}
    </div>
  )
}
