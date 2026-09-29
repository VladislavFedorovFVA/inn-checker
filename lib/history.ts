export type HistoryItem = {
  inn: string
  company_name: string
  status: string | null
  saved_at: number
}

const KEY = 'inn_check_history'
const MAX_ITEMS = 20

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveToHistory(item: Omit<HistoryItem, 'saved_at'>) {
  if (typeof window === 'undefined') return
  const list = getHistory().filter((x) => x.inn !== item.inn)
  list.unshift({ ...item, saved_at: Date.now() })
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ITEMS)))
}

export function removeFromHistory(inn: string) {
  if (typeof window === 'undefined') return
  const list = getHistory().filter((x) => x.inn !== inn)
  localStorage.setItem(KEY, JSON.stringify(list))
}