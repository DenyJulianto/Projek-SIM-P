const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const HARI = ['M', 'S', 'S', 'R', 'K', 'J', 'S']

export default function MiniCalendar({ tone = 'navy', title = 'Kalender', highlightDays = [] }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const highlightSet = new Set(highlightDays)

  const isBlue = tone === 'blue'
  const titleClass = isBlue ? 'text-slate-700' : 'text-navy'
  const subClass = isBlue ? 'text-slate-400' : 'text-navy/50'
  const headClass = isBlue ? 'text-slate-400' : 'text-navy/40'
  const todayClass = isBlue ? 'bg-blue-600 text-white font-bold' : 'bg-navy text-white font-bold'
  const dayClass = isBlue ? 'text-slate-600 hover:bg-blue-50' : 'text-navy/70 hover:bg-gold-light/30'
  const highlightClass = isBlue ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gold-light/50 text-navy font-bold'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className={`text-base font-extrabold ${titleClass}`}>{title}</h2>
        <p className={`text-sm ${subClass}`}>
          {BULAN[month]} {year}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {HARI.map((h, i) => (
          <div key={i} className={`text-[11px] font-semibold py-0.5 ${headClass}`}>
            {h}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`text-xs rounded-full h-7 w-7 mx-auto flex items-center justify-center ${
              day === today.getDate()
                ? todayClass
                : day && highlightSet.has(day)
                ? highlightClass
                : day
                ? dayClass
                : ''
            }`}
          >
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  )
}
