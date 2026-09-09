import { NextResponse } from 'next/server'
import { getSession, unauthorized } from './auth'
import { getUserData, setUserData } from './userdata'

export const textSetting = (key: 'name' | 'signature', maximum: number) => ({
  GET: async () => {
    const session = await getSession()
    if (!session) return unauthorized()
    try {
      const data = await getUserData(session.email)
      if (data[key] !== undefined && typeof data[key] !== 'string')
        throw new Error('Invalid stored value')
      return NextResponse.json({ [key]: data[key] ?? '' })
    } catch {
      return NextResponse.json(
        { error: 'Could not load this setting. Please try again.' },
        { status: 503 },
      )
    }
  },
  POST: async (request: Request) => {
    const session = await getSession()
    if (!session) return unauthorized()
    const input = await request.json().catch(() => null)
    const value = input?.[key]
    if (
      typeof value !== 'string' ||
      value.length > maximum ||
      /\x00/.test(value) ||
      (key === 'name' && /[\r\n]/.test(value))
    )
      return NextResponse.json(
        { error: `Enter valid text, up to ${maximum} characters.` },
        { status: 400 },
      )
    try {
      await setUserData(session.email, {
        [key]: key === 'name' ? value.trim() : value,
      })
      return NextResponse.json({ ok: true })
    } catch {
      return NextResponse.json(
        { error: 'Could not save this setting. Please try again.' },
        { status: 503 },
      )
    }
  },
})
