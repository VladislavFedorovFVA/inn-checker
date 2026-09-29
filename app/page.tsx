'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getHistory, removeFromHistory, type HistoryItem } from '@/lib/history'

export default function HomePage() {
  const [inn, setInn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const router = useRouter()

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/check-inn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inn }),
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(data.error || 'Что-то пошло не так')
      return
    }

    router.push(`/check/${inn}`)
  }

  function handleRemove(e: React.MouseEvent, innToRemove: string) {
    e.stopPropagation()
    removeFromHistory(innToRemove)
    setHistory(getHistory())
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold text-center mb-2">
          Проверка контрагента
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Введите ИНН — получите отчёт за 5 секунд
        </p>
        <form onSubmit={handleCheck} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            value={inn}
            onChange={(e) => setInn(e.target.value.replace(/\D/g, ''))}
            placeholder="Введите ИНН (10 или 12 цифр)"
            className="w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={loading || inn.length < 10}
            className="w-full bg-black text-white rounded-lg py-3 font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Загружаем отчёт...' : 'Проверить'}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-red-600 text-center text-sm">{error}</p>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Мои проверки
            </h2>
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.inn}
                  onClick={() => router.push(`/check/${item.inn}`)}
                  className="bg-white rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.company_name}</p>
                    <p className="text-xs text-gray-500">
                      ИНН {item.inn} ·{' '}
                      {new Date(item.saved_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleRemove(e, item.inn)}
                    className="text-gray-400 hover:text-red-600 text-lg shrink-0"
                    title="Удалить"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}