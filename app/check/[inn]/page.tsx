'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { saveToHistory } from '@/lib/history'

type Report = {
  inn: string
  ogrn: string | null
  kpp: string | null
  company_name: string
  status: string | null
  registration_date: string | null
  actuality_date: string | null
  director: string | null
  founder: string | null
  is_bankrupt: boolean
  address_valid: boolean
  address: string | null
  okved: string | null
  capital: number | null
}

export default function CheckPage() {
  const params = useParams()
  const router = useRouter()
  const inn = params.inn as string

  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/check-inn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inn }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ошибка')
        return
      }
    setReport(data)
      saveToHistory({
        inn: data.inn,
        company_name: data.company_name,
        status: data.status,
      })
    }
    load()
  }, [inn])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-sm underline text-gray-600"
          >
            ← Вернуться на главную
          </button>
        </div>
      </main>
    )
  }

  if (!report) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <p className="text-gray-600">Загружаем отчёт...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Проверить другой ИНН
          </button>
          <button
            onClick={() => window.print()}
            className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Скачать PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold">{report.company_name}</h1>
              <p className="text-sm text-gray-500 mt-1">ИНН {report.inn}</p>
            </div>
            {report.status && (
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                  report.status === 'Действующая'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {report.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Row label="ОГРН" value={report.ogrn} />
            <Row label="КПП" value={report.kpp} />
            <Row label="Дата регистрации" value={report.registration_date} />
            <Row label="Данные актуальны на" value={report.actuality_date} />
            <Row label="Руководитель" value={report.director} />
            <Row label="Учредитель" value={report.founder} />
            <Row label="ОКВЭД" value={report.okved} />
            <Row
              label="Уставный капитал"
              value={
                report.capital
                  ? `${report.capital.toLocaleString('ru-RU')} ₽`
                  : null
              }
            />
          </div>

          <div className="mt-8 pt-6 border-t space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-lg">
                {report.is_bankrupt ? '🔴' : '🟢'}
              </span>
              <div>
                <p className="font-medium">
                  {report.is_bankrupt
                    ? 'Активное банкротство'
                    : 'Банкротство не обнаружено'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">
                {report.address_valid ? '🟢' : '🟡'}
              </span>
              <div>
                <p className="font-medium">
                  {report.address_valid
                    ? 'Адрес проверен и действителен'
                    : 'Адрес требует проверки'}
                </p>
                {report.address && (
                  <p className="text-gray-500 mt-1">{report.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Источник данных: DaData. Отчёт носит информационный характер.
        </p>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  )
}