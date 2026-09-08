import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { getUserData, updateUserData } from '@/lib/userdata'

export const GET = async () => {
  const session = await getSession()
  if (!session) return unauthorized()
  const data = await getUserData(session.email)
  return NextResponse.json({ templates: data.replyTemplates ?? [] })
}

export const POST = async (request: Request) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const payload = await request.json().catch(() => null)
  if (
    typeof payload?.name !== 'string' ||
    typeof payload?.body !== 'string' ||
    !payload.name.trim() ||
    !payload.body.trim() ||
    payload.name.length > 80 ||
    payload.body.length > 10000
  ) {
    return NextResponse.json(
      {
        error:
          'Add a name (up to 80 characters) and a reply (up to 10,000 characters).',
      },
      { status: 400 },
    )
  }
  const template = {
    id: randomUUID(),
    name: payload.name.trim(),
    body: payload.body.trim(),
  }
  try {
    await updateUserData(session.email, (current) => {
      if ((current.replyTemplates?.length ?? 0) >= 100)
        throw new Error(
          'Your library is full. Remove a template before adding another.',
        )
      return {
        ...current,
        replyTemplates: [...(current.replyTemplates ?? []), template],
      }
    })
    return NextResponse.json({ template }, { status: 201 })
  } catch {
    return NextResponse.json(
      {
        error:
          'Could not save the template. Your library may be full. Please try again.',
      },
      { status: 500 },
    )
  }
}

export const DELETE = async (request: Request) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const payload = await request.json().catch(() => null)
  if (typeof payload?.id !== 'string' || payload.id.length > 100) {
    return NextResponse.json(
      { error: 'A template ID is required.' },
      { status: 400 },
    )
  }
  try {
    await updateUserData(session.email, (current) => ({
      ...current,
      replyTemplates: (current.replyTemplates ?? []).filter(
        (template) => template.id !== payload.id,
      ),
    }))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Could not delete the template. Please try again.' },
      { status: 500 },
    )
  }
}

export const PATCH = async (request: Request) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const payload = await request.json().catch(() => null)
  if (
    typeof payload?.id !== 'string' ||
    !payload.id ||
    payload.id.length > 100 ||
    typeof payload.name !== 'string' ||
    typeof payload.body !== 'string' ||
    !payload.name.trim() ||
    !payload.body.trim() ||
    payload.name.length > 80 ||
    payload.body.length > 10000
  ) {
    return NextResponse.json(
      { error: 'Add a valid name and reply.' },
      { status: 400 },
    )
  }
  const template = {
    id: payload.id,
    name: payload.name.trim(),
    body: payload.body.trim(),
  }
  try {
    let found = false
    await updateUserData(session.email, (current) => ({
      ...current,
      replyTemplates: (current.replyTemplates ?? []).map((existing) => {
        if (existing.id !== template.id) return existing
        found = true
        return template
      }),
    }))
    if (!found)
      return NextResponse.json(
        { error: 'This template no longer exists. Reload your library.' },
        { status: 404 },
      )
    return NextResponse.json({ template })
  } catch {
    return NextResponse.json(
      { error: 'Could not update this template. Please try again.' },
      { status: 500 },
    )
  }
}
