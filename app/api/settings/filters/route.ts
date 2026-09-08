import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { readSieveConfig, trySaveSieveConfig } from '@/lib/sieve'
import type { SieveFilter } from '@/lib/sieve'

// GET — list filters
export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const config = await readSieveConfig(session.email)
  return NextResponse.json({ filters: config.filters || [] })
}

// PUT — replace all filters
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { filters } = (await req.json()) as { filters: SieveFilter[] }

  if (
    !Array.isArray(filters) ||
    filters.length > 100 ||
    filters.some(
      (filter) =>
        !filter ||
        typeof filter.id !== 'string' ||
        !['from', 'to', 'subject'].includes(filter.field) ||
        filter.action !== 'move' ||
        typeof filter.enabled !== 'boolean' ||
        typeof filter.contains !== 'string' ||
        !filter.contains.trim() ||
        filter.contains.length > 500 ||
        typeof filter.destination !== 'string' ||
        !filter.destination.trim() ||
        filter.destination.length > 160 ||
        /[\x00-\x1f\x7f]/.test(filter.destination),
    )
  ) {
    return NextResponse.json({ error: 'Invalid filters' }, { status: 400 })
  }

  const config = await readSieveConfig(session.email)
  config.filters = filters
  const saveError = await trySaveSieveConfig(session.email, config)

  if (saveError) return NextResponse.json({ error: saveError }, { status: 500 })

  return NextResponse.json({ ok: true })
}
