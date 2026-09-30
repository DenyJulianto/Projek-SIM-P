export default function Pagination({ meta, page, setPage }) {
  if (meta.last_page <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-navy/5 text-xs text-navy/50">
      <span>
        Halaman {meta.current_page} dari {meta.last_page} ({meta.total} data)
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={meta.current_page === 1}
          className="h-7 w-7 rounded-full flex items-center justify-center border border-navy/10 disabled:opacity-30 hover:bg-navy/5"
        >
          ‹
        </button>
        <button
          onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
          disabled={meta.current_page === meta.last_page}
          className="h-7 w-7 rounded-full flex items-center justify-center border border-navy/10 disabled:opacity-30 hover:bg-navy/5"
        >
          ›
        </button>
      </div>
    </div>
  )
}
