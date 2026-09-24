export default function FilterSelect({ icon: Icon, value, onChange, children }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light pointer-events-none" />
      <select
        value={value}
        onChange={onChange}
        className="appearance-none w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-9 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50 pointer-events-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
