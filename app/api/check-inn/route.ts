import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { inn } = await request.json()

  if (!inn || !/^\d{10}$|^\d{12}$/.test(inn)) {
    return NextResponse.json(
      { error: 'ИНН должен быть 10 или 12 цифр' },
      { status: 400 }
    )
  }

  const res = await fetch(
    'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${process.env.DADATA_API_KEY}`,
      },
      body: JSON.stringify({ query: inn }),
    }
  )

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Ошибка запроса к DaData' },
      { status: 500 }
    )
  }

  const data = await res.json()

  if (!data.suggestions || data.suggestions.length === 0) {
    return NextResponse.json({ error: 'Компания не найдена' }, { status: 404 })
  }

  const s = data.suggestions[0]
  const d = s.data

  const regDate = d.state?.registration_date
    ? new Date(d.state.registration_date).toISOString().split('T')[0]
    : null

  const actualityDate = d.state?.actuality_date
    ? new Date(d.state.actuality_date).toISOString().split('T')[0]
    : null

  // Расшифровка статуса
  const statusMap: Record<string, string> = {
    ACTIVE: 'Действующая',
    LIQUIDATING: 'Ликвидируется',
    LIQUIDATED: 'Ликвидирована',
    REORGANIZING: 'В процессе реорганизации',
    BANKRUPT: 'Банкрот',
  }

  // Ищем долг в таблице, залитой из данных ФНС
  const { data: debtRow } = await supabase
    .from('tax_debts')
    .select('debt_amount')
    .eq('inn', inn)
    .maybeSingle()

  const taxDebt = debtRow?.debt_amount ?? 0

  return NextResponse.json({
    inn,
    ogrn: d.ogrn ?? null,
    kpp: d.kpp ?? null,
    company_name: s.value,
    status: statusMap[d.state?.status] ?? d.state?.status ?? null,
    registration_date: regDate,
    actuality_date: actualityDate,
    director: d.management?.name ?? null,
    founder: d.founders?.[0]?.name ?? null,
    is_bankrupt: d.state?.status === 'BANKRUPT',
    address_valid: d.address?.data?.qc === '0',
    address: d.address?.value ?? null,
    okved: d.okved ?? null,
    capital: d.capital?.value ?? null,
    tax_debt: taxDebt,  // ← новое поле
  })
}