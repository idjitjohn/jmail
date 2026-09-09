import { EncryptJWT, jwtDecrypt } from 'jose'

const secretKey = async () => {
  const secret = process.env.NEXTAUTH_SECRET || ''
  if (new TextEncoder().encode(secret).length < 32)
    throw new Error('NEXTAUTH_SECRET must contain at least 32 bytes')
  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)),
  )
}

export const seal = async (
  payload: Record<string, unknown>,
  purpose: string,
  expiration?: string | number,
) => {
  const token = new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setAudience(purpose)
    .setIssuedAt()
  if (expiration) token.setExpirationTime(expiration)
  return token.encrypt(await secretKey())
}

export const unseal = async (token: string, purpose: string) =>
  (await jwtDecrypt(token, await secretKey(), { audience: purpose })).payload
