export const readApiResponse = async <T>(
  response: Response,
  fallback: string,
): Promise<T> => {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      response.status === 401
        ? 'Your session has expired. Sign in again to continue.'
        : response.status === 403
          ? 'This action was blocked. Reload JMail and try again.'
          : typeof data?.error === 'string'
            ? data.error
            : fallback
    throw new Error(message)
  }
  if (data === null) throw new Error(fallback)
  return data as T
}
