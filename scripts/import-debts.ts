import fs from 'fs'
import path from 'path'
import { XMLParser } from 'fast-xml-parser'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DATA_DIR = path.join(process.cwd(), 'debt-data')
const BATCH_SIZE = 500

type Doc = {
  СведНП: { '@_ИННЮЛ': string | number; '@_НаимОрг': string }
  СведНедоим?:
    | { '@_ОбщСумНедоим': string | number }
    | { '@_ОбщСумНедоим': string | number }[]
}

async function main() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.xml'))
  console.log(`Найдено файлов: ${files.length}`)

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: false,
  })

  const map = new Map<string, { name: string; debt: number }>()
  let processed = 0

  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8')
    const parsed = parser.parse(content)

    const rawDocs = parsed.Файл.Документ
    const docs: Doc[] = Array.isArray(rawDocs) ? rawDocs : [rawDocs]

    for (const doc of docs) {
      const inn = String(doc.СведНП['@_ИННЮЛ'])
      const name = doc.СведНП['@_НаимОрг']

      const недоимки = doc.СведНедоим
        ? Array.isArray(doc.СведНедоим)
          ? doc.СведНедоим
          : [doc.СведНедоим]
        : []

      let total = 0
      for (const n of недоимки) {
        total += parseFloat(String(n['@_ОбщСумНедоим'])) || 0
      }

      const existing = map.get(inn)
      if (existing) {
        existing.debt += total
      } else {
        map.set(inn, { name, debt: total })
      }
    }

    processed++
    if (processed % 100 === 0) {
      console.log(`Обработано файлов: ${processed}/${files.length}`)
    }
  }

  console.log(`Уникальных ИНН: ${map.size}`)

  const rows = Array.from(map.entries()).map(([inn, v]) => ({
    inn,
    company_name: v.name,
    debt_amount: Math.round(v.debt * 100) / 100,
  }))

  // Убираем мусорный ключ "undefined", если он случайно попал
  const cleanRows = rows.filter((r) => r.inn && r.inn !== 'undefined')
  console.log(`После очистки: ${cleanRows.length}`)

  for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
    const batch = cleanRows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('tax_debts')
      .upsert(batch, { onConflict: 'inn' })

    if (error) {
      console.error('Ошибка на батче', i, error)
      process.exit(1)
    }
    console.log(`Залито: ${Math.min(i + BATCH_SIZE, cleanRows.length)}/${cleanRows.length}`)
  }

  console.log('Готово!')
}

main().catch(console.error)