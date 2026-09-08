import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { getUserData, updateUserData } from '@/lib/userdata'
import { normalizePreferences, parsePreferencePatch } from '@/lib/preferences'

export const GET = async () => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    const data = await getUserData(session.email)
    return NextResponse.json({
      preferences: normalizePreferences(data.preferences),
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not load your preferences. Please try again.' },
      { status: 503 },
    )
  }
}

export const PATCH = async (request: Request) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  let patch
  try {
    patch = parsePreferencePatch(await request.json())
  } catch {
    return NextResponse.json(
      { error: 'Choose valid preference values.' },
      { status: 400 },
    )
  }
  try {
    let preferences = normalizePreferences(undefined)
    await updateUserData(session.email, (current) => {
      preferences = { ...normalizePreferences(current.preferences), ...patch }
      return { ...current, preferences }
    })
    return NextResponse.json({ preferences })
  } catch {
    return NextResponse.json(
      { error: 'Could not save your preferences. Please try again.' },
      { status: 503 },
    )
  }
}
