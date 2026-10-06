import { useState } from 'react'
import { api } from '../lib/api'

/** Import akun staf dari Excel; tiap akun baru menerima email undangan aktivasi. */
export default function ImportStafModal({ onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [hasil, setHasil] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function unggah(e) {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const res = await api.importStaf(file)
      setHasil(res)
      if (res.berhasil.length > 0) onImported()
    } catch (err) {
      setError(err.errors ? Object.values(err.errors).flat()[0] : err.message)
    } finally {
      setBusy(false)
    }
  }

  async function unduhTemplate() {
    setError('')
    try {
      await api.unduhTemplateImportStaf()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-extrabold text-navy">Import Staf dari Excel</h2>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-navy/50 mb-5">
          Setiap staf yang berhasil diimpor menerima email undangan untuk membuat password sendiri (berlaku 72 jam).
          Akun belum bisa dipakai login sebelum undangan diterima. Jika NIP diisi, staf juga bisa login memakai NIP.
        </p>

        <ol className="text-sm text-navy/70 space-y-3 mb-5 list-decimal list-inside">
          <li>
            <button onClick={unduhTemplate} className="font-semibold text-emerald-700 hover:underline">
              Unduh template Excel
            </button>{' '}
            — daftar peran yang valid ada di sheet "Daftar Peran".
          </li>
          <li>Isi Nama Lengkap, Email, dan Peran. NIP opsional; jika diisi untuk guru baru, Jenis Kelamin wajib L/P.</li>
          <li>Unggah file di bawah.</li>
        </ol>

        <form onSubmit={unggah} className="flex flex-wrap items-center gap-3 mb-4">
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm flex-1 min-w-0" />
          <button
            type="submit"
            disabled={!file || busy}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
          >
            {busy ? 'Mengimpor…' : 'Impor & Kirim Undangan'}
          </button>
        </form>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>}

        {hasil && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-emerald-700">
              {hasil.berhasil.length} staf diimpor dan undangan dikirim · {hasil.dilewati.length} baris dilewati
            </p>
            {hasil.berhasil.some((b) => b.undangan_terkirim === false) && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Akun dibuat, tetapi email undangan gagal dikirim ke:{' '}
                {hasil.berhasil.filter((b) => b.undangan_terkirim === false).map((b) => b.email).join(', ')}. Kirim ulang lewat
                tombol &quot;Kirim ulang undangan&quot; di Kelola Pengguna.
              </p>
            )}
            {hasil.dilewati.length > 0 && (
              <div className="border border-amber-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-amber-50 text-amber-900 text-left">
                    <tr>
                      <th className="px-3 py-2">Baris</th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Alasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.dilewati.map((d) => (
                      <tr key={d.baris} className="border-t border-amber-100">
                        <td className="px-3 py-2">{d.baris}</td>
                        <td className="px-3 py-2">{d.nama || '-'}</td>
                        <td className="px-3 py-2">{d.email || '-'}</td>
                        <td className="px-3 py-2 text-amber-800">{d.alasan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
