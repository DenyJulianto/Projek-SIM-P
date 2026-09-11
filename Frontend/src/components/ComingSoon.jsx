export default function ComingSoon({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-16 w-16 rounded-full bg-navy/5 flex items-center justify-center mb-4">
        <ClockIcon className="h-8 w-8 text-navy/30" />
      </div>
      <h1 className="text-xl font-extrabold text-navy mb-2">{title}</h1>
      <p className="text-sm text-navy/50 max-w-md">
        {description || 'Modul ini sedang dalam pengembangan dan akan segera hadir.'}
      </p>
    </div>
  )
}

function ClockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}
