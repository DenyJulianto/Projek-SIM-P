import { useEffect, useState } from 'react'
import ArsipDokumenFormModal from '../components/ArsipDokumenFormModal'
import SuratFormModal from '../components/SuratFormModal'
import { api, BASE_URL } from '../lib/api'

const STATUS_LABEL = {
  baru: { label: 'Baru', tone: 'bg-navy/10 text-navy/60' },
  diproses: { label: 'Diproses', tone: 'bg-gold-light/50 text-navy' },
  selesai: { label: 'Selesai', tone: 'bg-emerald-100 text-emerald-700' },
}

export default function SuratArsipManagement({ onBack, initialTab = 'surat' }) {
  const [tab, setTab] = useState(initialTab)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Surat-Menyurat &amp; Kearsipan</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-navy/10">
        <TabButton active={tab === 'surat'} onClick={() => setTab('surat')}>
          Surat Masuk &amp; Keluar
        </TabButton>
        <TabButton active={tab === 'arsip'} onClick={() => setTab('arsip')}>
          Arsip Dokumen
        </TabButton>
      </div>

      {tab === 'surat' ? <SuratTab /> : <ArsipTab />}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active ? 'border-navy text-navy' : 'border-transparent text-navy/40 hover:text-navy/70'
      }`}
    >
      {children}
    </button>
  )
}

function SuratTab() {
  const [items, setItems] = useState([])
  const [jenisFilter, setJenisFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function loadItems(params = {}) {
    setLoading(true)
    api
      .listSurat(params)
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems(jenisFilter ? { 'filter[jenis]': jenisFilter } : {})
    // eslint-disable-next-line
  }, [jenisFilter])

  function openEdit(item) {
    setEditingItem(item)
    setShowForm(true)
  }

  function openCreate() {
    setEditingItem(null)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    loadItems(jenisFilter ? { 'filter[jenis]': jenisFilter } : {})
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus surat "${item.perihal}"?`)) return
    try {
      await api.deleteSurat(item.id)
      loadItems(jenisFilter ? { 'filter[jenis]': jenisFilter } : {})
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select
          value={jenisFilter}
          onChange={(e) => setJenisFilter(e.target.value)}
          className="input max-w-[180px]"
        >
          <option value="">Semua Jenis</option>
          <option value="masuk">Surat Masuk</option>
          <option value="keluar">Surat Keluar</option>
        </select>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Tambah Surat
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Perihal</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Pengirim/Tujuan</th>
              <th className="px-4 py-3">Tgl. Agenda</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lampiran</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada surat.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{item.perihal}</td>
                  <td className="px-4 py-3 text-navy/70 capitalize">{item.jenis}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {item.jenis === 'masuk' ? item.pengirim : item.tujuan || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.tanggal_agenda?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABEL[item.status]?.tone}`}>
                      {STATUS_LABEL[item.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.file ? (
                      <a
                        href={`${BASE_URL}/surat-file/${item.file.replace('surat/', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-navy-light hover:underline text-xs font-semibold"
                      >
                        Lihat File
                      </a>
                    ) : (
                      <span className="text-navy/30 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <SuratFormModal surat={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}

function ArsipTab() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function loadItems(params = {}) {
    setLoading(true)
    api
      .listArsipDokumen(params)
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    loadItems(search ? { 'filter[judul]': search } : {})
  }

  function openEdit(item) {
    setEditingItem(item)
    setShowForm(true)
  }

  function openCreate() {
    setEditingItem(null)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    loadItems(search ? { 'filter[judul]': search } : {})
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus dokumen "${item.judul}"?`)) return
    try {
      await api.deleteArsipDokumen(item.id)
      loadItems(search ? { 'filter[judul]': search } : {})
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul dokumen..."
            className="input max-w-xs"
          />
          <button
            type="submit"
            className="text-sm font-semibold text-navy border border-navy/20 rounded-md px-4 hover:bg-navy hover:text-white transition-colors"
          >
            Cari
          </button>
        </form>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full whitespace-nowrap"
        >
          + Tambah Dokumen
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Nomor</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">Memuat...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">Belum ada dokumen.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{item.judul}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold bg-gold-light/40 text-navy px-2 py-0.5 rounded-full">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.nomor_dokumen || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{item.tanggal_dokumen?.slice(0, 10) || '-'}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`${BASE_URL}/arsip-file/${item.file.replace('arsip/', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-navy-light hover:underline text-xs font-semibold"
                    >
                      Lihat File
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ArsipDokumenFormModal
          dokumen={editingItem}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
