const PALETTE = [
  'bg-gold-light/40 text-navy',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-lime-100 text-lime-800',
]

export function roleBadgeClass(roleName) {
  if (!roleName) return PALETTE[0]
  if (roleName === 'Super Admin') return 'bg-navy text-white'
  let hash = 0
  for (let i = 0; i < roleName.length; i++) {
    hash = (hash * 31 + roleName.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}
