import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { readSieveConfig, trySaveSieveConfig } from '@/lib/sieve'
import { getMailServer } from '@/lib/maddy-admin'

// GET — list filters
export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const config = await readSieveConfig(session.email)
    const state = await getMailServer().catch(() => null)
    return NextResponse.json({
      filters: config.filters || [],
      active: Boolean(state?.filtersReady && state.active),
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not load mail filters. Please try again.' },
      { status: 503 },
    )
  }
}

// PUT — replace all filters
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { filters } = (await req.json().catch(() => ({}))) || {}

  if (
    !Array.isArray(filters) ||
    filters.length > 100 ||
    filters.some(
      (filter) =>
        !filter ||
        typeof filter.id !== 'string' ||
        !filter.id ||
        filter.id.length > 100 ||
        !['from', 'to', 'subject'].includes(filter.field) ||
        filter.action !== 'move' ||
        typeof filter.enabled !== 'boolean' ||
        typeof filter.contains !== 'string' ||
        !filter.contains.trim() ||
        filter.contains.length > 500 ||
        /[\x00-\x1f\x7f]/.test(filter.contains) ||
        typeof filter.destination !== 'string' ||
        !filter.destination.trim() ||
        filter.destination.length > 160 ||
        /[\x00-\x1f\x7f]/.test(filter.destination),
    )
  ) {
    return NextResponse.json({ error: 'Invalid filters' }, { status: 400 })
  }

  try {
    const saveError = await trySaveSieveConfig(session.email, { filters })
    if (saveError)
      return NextResponse.json({ error: saveError }, { status: 503 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Could not save mail filters. Please try again.' },
      { status: 503 },
    )
  }
}
