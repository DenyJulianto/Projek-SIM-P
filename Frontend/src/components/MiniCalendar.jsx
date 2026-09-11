const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const HARI = ['M', 'S', 'S', 'R', 'K', 'J', 'S']

export default function MiniCalendar() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-extrabold text-navy">Kalender</h2>
        <p className="text-sm text-navy/50">
          {BULAN[month]} {year}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {HARI.map((h, i) => (
          <div key={i} className="text-[11px] font-semibold text-navy/40 py-0.5">
            {h}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`text-xs rounded-full h-7 w-7 mx-auto flex items-center justify-center ${
              day === today.getDate()
                ? 'bg-navy text-white font-bold'
                : day
                  ? 'text-navy/70 hover:bg-gold-light/30'
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
