import { useState } from 'react'
import Pagination from '../components/Pagination'
import { api } from '../lib/api'
import { usePaginatedDirectory } from '../lib/usePaginatedDirectory'

export default function SekolahSiswaListPage({ sekolah, onBack, onSelectSiswa }) {
  const [search, setSearch] = useState('')
  const { items, meta, page, setPage, loading, error, reload } = usePaginatedDirectory(
    api.getSiswaDirectoryNasional,
    { 'filter[sekolah_id]': sekolah.id }
  )

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    reload({ 'filter[sekolah_id]': sekolah.id, ...(search ? { 'filter[nama]': search } : {}) })
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke {sekolah.nama_sekolah}
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Siswa di {sekolah.nama_sekolah}</h1>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama siswa..."
          className="flex-1 min-w-[200px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Nama</th>
              <th className="px-4 py-3 whitespace-nowrap">Kelas</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada data siswa yang cocok.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={`${item.sekolah_id}-${item.siswa_id}`} className="border-t border-navy/5">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectSiswa(item)}
                      className="font-medium text-navy hover:text-emerald-700 hover:underline text-left"
                    >
                      {item.nama}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.kelas || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy/60">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>
    </div>
  )
}
