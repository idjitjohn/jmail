import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSession, unauthorized } from '@/lib/auth'
import { getUserData, updateUserData } from '@/lib/userdata'
import { parseContact } from '@/lib/contacts'

export const GET = async () => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    return NextResponse.json((await getUserData(session.email)).contacts || [])
  } catch {
    return NextResponse.json(
      { error: 'Could not load contacts.' },
      { status: 500 },
    )
  }
}
const mutate = async (request: Request, method: string) => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    const text = await request.text()
    if (text.length > 2 * 1024 * 1024)
      throw new Error('This contacts file is too large.')
    const input = JSON.parse(text)
    const imported =
      method === 'POST'
        ? (Array.isArray(input) ? input : [input]).map(parseContact)
        : []
    await updateUserData(session.email, (data) => {
      let contacts = [...(data.contacts || [])]
      if (method === 'DELETE') {
        if (
          typeof input.id !== 'string' ||
          !contacts.some((contact) => contact.id === input.id)
        )
          throw new Error('Contact not found.')
        contacts = contacts.filter((contact) => contact.id !== input.id)
      } else if (method === 'PATCH') {
        const contact = parseContact(input)
        if (!contacts.some((item) => item.id === input.id))
          throw new Error('Contact not found.')
        if (
          contacts.some(
            (item) => item.email === contact.email && item.id !== input.id,
          )
        )
          throw new Error('A contact already has this email address.')
        contacts = contacts.map((item) =>
          item.id === input.id ? { ...contact, id: item.id } : item,
        )
      } else {
        for (const contact of imported)
          if (!contacts.some((item) => item.email === contact.email))
            contacts.push({ ...contact, id: randomUUID() })
      }
      if (contacts.length > 5000)
        throw new Error('You can save up to 5,000 contacts.')
      return { ...data, contacts }
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not save contacts.',
      },
      { status: 400 },
    )
  }
}
export const POST = (request: Request) => mutate(request, 'POST')
export const PATCH = (request: Request) => mutate(request, 'PATCH')
export const DELETE = (request: Request) => mutate(request, 'DELETE')
