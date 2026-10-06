import TahunAjaranSemesterPanel from '../components/TahunAjaranSemesterPanel'

/** Halaman Tahun Ajaran & Semester untuk dasbor Kurikulum. */
export default function TahunAjaranSemesterPage({ onBack }) {
  return (
    <div>
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <CalendarRangeIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Tahun Ajaran &amp; Semester</h1>
            <p className="text-sm text-navy/50">
              Atur tahun ajaran dan semester yang dipakai di kelas, struktur kurikulum, jadwal, dan rapor. Tandai satu
              tahun ajaran dan satu semester sebagai aktif.
            </p>
          </div>
        </div>
      </div>

      <TahunAjaranSemesterPanel />
    </div>
  )
}

function CalendarRangeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 14h8" />
    </svg>
  )
}
