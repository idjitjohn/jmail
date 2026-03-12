import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { readSieveConfig, writeSieveConfig } from '@/lib/sieve'
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

  const { filters } = await req.json() as { filters: SieveFilter[] }

  if (!Array.isArray(filters)) {
    return NextResponse.json({ error: 'Invalid filters' }, { status: 400 })
  }

  const config = await readSieveConfig(session.email)
  config.filters = filters
  await writeSieveConfig(session.email, config)

  return NextResponse.json({ ok: true })
}
