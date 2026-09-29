import { useEffect, useState } from 'react'

export function usePaginatedDirectory(fetcher, extraFilters) {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load(filters) {
    setLoading(true)
    setError('')
    fetcher({ page, per_page: 20, ...filters })
      .then((res) => {
        setItems(res.data)
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(extraFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return { items, meta, page, setPage, loading, error, reload: load }
}
