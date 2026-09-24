const AVATAR_COLORS = ['bg-emerald-700', 'bg-navy-light', 'bg-emerald-600', 'bg-gold', 'bg-teal-600']

export default function InitialsAvatar({ name, size = 'h-8 w-8' }) {
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={`${size} rounded-full ${AVATAR_COLORS[(name || '').length % AVATAR_COLORS.length]} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  )
}
