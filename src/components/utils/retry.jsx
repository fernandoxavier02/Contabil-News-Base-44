export async function retry(fn, { retries = 3, baseDelayMs = 800, factor = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const delay = baseDelayMs * Math.pow(factor, attempt);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastErr;
}

export function createRateLimiter(intervalMs = 1200) {
  let last = 0;
  return async () => {
    const now = Date.now();
    const wait = Math.max(0, intervalMs - (now - last));
    if (wait > 0) {
      await new Promise(res => setTimeout(res, wait));
    }
    last = Date.now();
  };
}