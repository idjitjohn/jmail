const certificateCodes = new Set([
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
])

const diagnosticCodes = new Set([
  ...certificateCodes,
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETLS',
  'ESOCKET',
  'ERR_SSL_WRONG_VERSION_NUMBER',
  'ERR_TLS_HANDSHAKE_TIMEOUT',
])

export const mailAuthenticationError = (error: unknown) => {
  const details =
    error && typeof error === 'object'
      ? (error as {
          code?: string
          authenticationFailed?: boolean
          serverResponseCode?: string
        })
      : {}
  const code = typeof details.code === 'string' ? details.code : ''
  if (
    certificateCodes.has(code) ||
    code.startsWith('ERR_TLS_') ||
    code.startsWith('ERR_SSL_')
  )
    return {
      status: 503,
      code: 'MAIL_TLS_ERROR',
      error:
        'The secure connection to the mail server failed. Please contact your administrator.',
    }
  if (
    details.authenticationFailed === true &&
    (!details.serverResponseCode ||
      details.serverResponseCode === 'AUTHENTICATIONFAILED')
  )
    return {
      status: 401,
      code: 'INVALID_CREDENTIALS',
      error: 'The mail server rejected this email or password.',
    }
  return {
    status: 503,
    code: 'MAIL_UNAVAILABLE',
    error: 'The mail server is unavailable. Please try again shortly.',
  }
}

export const logLoginFailure = (error: unknown, stage: 'imap' | 'session') => {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? error.code
      : undefined
  const category =
    stage === 'session'
      ? 'SESSION_CONFIGURATION_ERROR'
      : mailAuthenticationError(error).code
  const reason =
    stage === 'session' &&
    Buffer.byteLength(process.env.NEXTAUTH_SECRET || '') < 32
      ? 'NEXTAUTH_SECRET_MISSING_OR_WEAK'
      : typeof code === 'string' && diagnosticCodes.has(code)
        ? code
        : category

  // Fixed diagnostic fields without credentials or raw server responses
  console.error('[auth/login]', { stage, category, reason })
}
