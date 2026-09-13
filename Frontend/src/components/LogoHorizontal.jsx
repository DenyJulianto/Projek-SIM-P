import Logo from './Logo'
import LogoWordmark from './LogoWordmark'

// Logo ringkas (ikon + wordmark) tersusun horizontal, dipakai di ruang
// sempit seperti sidebar dashboard atau nav bar — versi penuh (LogoStacked)
// terlalu tinggi untuk muat di situ.
export default function LogoHorizontal({
  subtitle,
  badgeClassName = 'h-9 w-9',
  ringClassName = 'ring-white/30',
  iconClassName = 'h-5 w-5',
  textClassName = 'text-sm',
  textColorClassName = 'text-white',
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <div className={`${badgeClassName} rounded-full bg-white ring-2 ${ringClassName} flex items-center justify-center shrink-0`}>
        <Logo className={iconClassName} />
      </div>
      <div className="min-w-0">
        <LogoWordmark size={textClassName} className={`${textColorClassName} truncate`} />
        {subtitle && (
          <p className={`text-[11px] leading-tight truncate ${textColorClassName} opacity-60`}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
