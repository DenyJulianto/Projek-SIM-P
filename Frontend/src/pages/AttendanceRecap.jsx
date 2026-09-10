import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alpha', label: 'Alpha' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function AttendanceRecap({ onBack, canSiswa, canGuru }) {
  const [tanggal, setTanggal] = useState(today())
  const [rekapSiswa, setRekapSiswa] = useState(null)
  const [rekapGuru, setRekapGuru] = useState(null)
  const [error, setError] = useState('')

  const [kelasList, setKelasList] = useState([])
  const [selectedKelas, setSelectedKelas] = useState('')
  const [siswaList, setSiswaList] = useState([])
  const [siswaStatus, setSiswaStatus] = useState({})
  const [savingSiswa, setSavingSiswa] = useState(false)

  const [guruList, setGuruList] = useState([])
  const [guruStatus, setGuruStatus] = useState({})
  const [savingGuru, setSavingGuru] = useState(false)

  function loadRekap() {
    if (canSiswa) {
      api
        .getRekapAbsensiSiswa(tanggal, selectedKelas || undefined)
        .then(setRekapSiswa)
        .catch(() => {})
    }
    if (canGuru) {
      api.getRekapAbsensiGuru(tanggal).then(setRekapGuru).catch(() => {})
    }
  }

  useEffect(() => {
    if (canSiswa) api.listKelasAll().then((r) => setKelasList(r.data)).catch(() => {})
    if (canGuru) api.listGuruAll().then((r) => setGuruList(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    loadRekap()
    // eslint-disable-next-line
  }, [tanggal, selectedKelas])

  useEffect(() => {
    if (!selectedKelas) {
      setSiswaList([])
      return
    }
    api
      .listSiswaByKelas(selectedKelas)
      .then((r) => {
        setSiswaList(r.data)
        setSiswaStatus(Object.fromEntries(r.data.map((s) => [s.id, 'hadir'])))
      })
      .catch(() => {})
  }, [selectedKelas])

  useEffect(() => {
    setGuruStatus(Object.fromEntries(guruList.map((g) => [g.id, 'hadir'])))
  }, [guruList])

  async function handleSaveSiswa() {
    setSavingSiswa(true)
    setError('')
    try {
      const items = siswaList.map((s) => ({
        siswa_id: s.id,
        kelas_id: Number(selectedKelas),
        status: siswaStatus[s.id] || 'hadir',
      }))
      await api.bulkSaveAbsensiSiswa(tanggal, items)
      loadRekap()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSiswa(false)
    }
  }

  async function handleSaveGuru() {
    setSavingGuru(true)
    setError('')
    try {
      const items = guruList.map((g) => ({ guru_id: g.id, status: guruStatus[g.id] || 'hadir' }))
      await api.bulkSaveAbsensiGuru(tanggal, items)
      loadRekap()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingGuru(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Rekap & Input Absensi Harian</h1>
        </div>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-navy/50 mb-1">Tanggal</span>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="input"
          />
        </label>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {canSiswa && rekapSiswa && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">
            Rekap Absensi Siswa
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATUS_OPTIONS.map((s) => (
              <StatBox key={s.value} label={s.label} value={rekapSiswa[s.value]} />
            ))}
          </div>
        </div>
      )}

      {canGuru && rekapGuru && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">
            Rekap Absensi Guru
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATUS_OPTIONS.map((s) => (
              <StatBox key={s.value} label={s.label} value={rekapGuru[s.value]} />
            ))}
          </div>
        </div>
      )}

      {canSiswa && (
        <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-navy">Input Absensi Siswa</h2>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="input max-w-[200px]"
            >
              <option value="">Pilih Kelas...</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>

          {!selectedKelas ? (
            <p className="text-navy/40 text-sm">Pilih kelas untuk mulai mengisi absensi.</p>
          ) : siswaList.length === 0 ? (
            <p className="text-navy/40 text-sm">Belum ada siswa di kelas ini.</p>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {siswaList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-navy/80">{s.nama}</span>
                    <select
                      value={siswaStatus[s.id] || 'hadir'}
                      onChange={(e) =>
                        setSiswaStatus((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      className="input max-w-[140px] py-1.5"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveSiswa}
                  disabled={savingSiswa}
                  className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
                >
                  {savingSiswa ? 'Menyimpan...' : 'Simpan Absensi Siswa'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {canGuru && (
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="font-bold text-navy mb-4">Input Absensi Guru</h2>
          {guruList.length === 0 ? (
            <p className="text-navy/40 text-sm">Belum ada data guru.</p>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {guruList.map((g) => (
                  <div key={g.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-navy/80">{g.nama}</span>
                    <select
                      value={guruStatus[g.id] || 'hadir'}
                      onChange={(e) =>
                        setGuruStatus((prev) => ({ ...prev, [g.id]: e.target.value }))
                      }
                      className="input max-w-[140px] py-1.5"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveGuru}
                  disabled={savingGuru}
                  className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
                >
                  {savingGuru ? 'Menyimpan...' : 'Simpan Absensi Guru'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-navy/10 p-4 text-center">
      <p className="text-2xl font-extrabold text-navy">{value ?? '-'}</p>
      <p className="text-xs text-navy/50 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  )
}
