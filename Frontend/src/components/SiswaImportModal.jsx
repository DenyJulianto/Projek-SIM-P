import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function SiswaImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleDownloadTemplate() {
    setDownloading(true)
    setError('')
    try {
      await api.downloadSiswaImportTemplate()
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setImporting(true)
    setError('')
    setResult(null)
    try {
      const res = await api.importSiswaDirectoryNasional(file)
      setResult(res)
      if (res.berhasil > 0) onImported()
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-1">Import Data Siswa</h2>
        <p className="text-sm text-navy/50 mb-4">
          Untuk memasukkan banyak siswa sekaligus lintas sekolah dari file Excel.
        </p>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-sm text-navy/70">
            1. Unduh template, isi data sesuai kolom yang tersedia, lalu unggah kembali di sini.
          </p>
          <p className="text-xs text-navy/50">
            Setiap baris wajib mencantumkan <strong>NPSN Sekolah</strong> tujuan — sekolahnya harus
            sudah terdaftar lebih dulu di menu Data Sekolah.
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="text-sm font-semibold text-navy-light hover:underline disabled:opacity-50"
          >
            {downloading ? 'Menyiapkan...' : '⬇ Unduh Template (.xlsx)'}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">
              2. Pilih File Hasil Isian (.xlsx)
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input"
            />
          </label>

          <p className="text-xs text-navy/40">
            Maksimal 1000 baris per file. NIS/NISN yang sudah terdaftar di sekolah tujuan akan
            otomatis dilewati. Kelas belum ditetapkan saat import — atur lewat menu Data Siswa di
            sekolah masing-masing.
          </p>

          {result && (
            <div className="rounded-xl border border-navy/10 p-4 space-y-2">
              <p className="text-sm text-navy">
                Dari <span className="font-semibold">{result.total_baris}</span> baris:{' '}
                <span className="font-semibold text-emerald-600">{result.berhasil} berhasil</span>,{' '}
                <span className="font-semibold text-red-600">{result.gagal} gagal</span>.
              </p>
              {result.catatan && <p className="text-xs text-navy/50">{result.catatan}</p>}
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((msg, i) => (
                    <p key={i} className="text-xs text-red-600">
                      {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={importing || !file}
              className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {importing ? 'Mengimpor...' : 'Mulai Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
