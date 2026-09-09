const parseOrigin = (value: string) => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value
      ? url.origin
      : null
  } catch {
    return null
  }
}

export const isSameOriginRequest = (request: Request) => {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false

  const origin = request.headers.get('origin')
  if (!origin) return true
  const source = parseOrigin(origin)
  if (!source) return false

  // Browser-owned metadata, unaffected by proxy URL rewriting
  if (site === 'same-origin') return true

  const target = new URL(request.url)
  if (source === target.origin) return true

  // Original Host header fallback for older clients
  const host = request.headers.get('host')
  const forwardedProtocol = request.headers.get('x-forwarded-proto')
  const protocol = ['http', 'https'].includes(forwardedProtocol || '')
    ? forwardedProtocol
    : target.protocol.slice(0, -1)

  return Boolean(host && source === parseOrigin(`${protocol}://${host}`))
}
