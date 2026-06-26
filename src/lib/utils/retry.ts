export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs * attempt))
      }
    }
  }
  throw lastError
}
