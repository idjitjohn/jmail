type Bucket = { count: number; until: number }
const buckets = new Map<string, Bucket>()
export const rateLimit = (key: string, maximum: number, duration: number) => {
  const now = Date.now()
  for (const [id, bucket] of buckets)
    if (bucket.until <= now) buckets.delete(id)
  const bucket = buckets.get(key) || { count: 0, until: now + duration }
  if (buckets.size > 10000 && !buckets.has(key)) return false
  buckets.set(key, bucket)
  return ++bucket.count <= maximum
}
