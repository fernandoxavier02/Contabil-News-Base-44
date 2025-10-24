const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

const ENDPOINTS = {
  fetchRealNews:
    import.meta.env.VITE_API_ROUTE_FETCH_REAL_NEWS || "/integrations/news/fetch",
  verifyNewsDates:
    import.meta.env.VITE_API_ROUTE_VERIFY_NEWS_DATES || "/integrations/news/verify-dates",
  clearAllNews: import.meta.env.VITE_API_ROUTE_CLEAR_NEWS || "/news/clear",
  resetSources: import.meta.env.VITE_API_ROUTE_RESET_SOURCES || "/sources/reset",
  sendToTelegram:
    import.meta.env.VITE_API_ROUTE_SEND_TELEGRAM || "/integrations/telegram/send-test",
  sendToWhatsApp:
    import.meta.env.VITE_API_ROUTE_SEND_WHATSAPP || "/integrations/whatsapp/send-test",
  sendToTeams:
    import.meta.env.VITE_API_ROUTE_SEND_TEAMS || "/integrations/teams/send-test",
  sendToEmail:
    import.meta.env.VITE_API_ROUTE_SEND_EMAIL || "/integrations/email/send-test",
  generateNews:
    import.meta.env.VITE_API_ROUTE_GENERATE_NEWS || "/integrations/news/generate",
};

const DEFAULT_TIMEOUT_MS = parseEnvInt(import.meta.env.VITE_API_TIMEOUT_MS, 10_000);
const DEFAULT_MAX_RETRIES = parseEnvInt(import.meta.env.VITE_API_MAX_RETRIES, 2);
const DEFAULT_RETRY_BASE_DELAY_MS = parseEnvInt(
  import.meta.env.VITE_API_RETRY_BASE_DELAY_MS,
  500
);
const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504, 522, 524]);

function parseEnvInt(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function wait(ms) {
  if (!ms || ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, ms);
  });
}

function buildErrorMessage(route, url, status, statusText, details) {
  const suffix = details ? `: ${details}` : "";
  return `[remoteApi] ${status} ${statusText} while calling ${route} (${url})${suffix}`;
}

function isConfigured() {
  return Boolean(API_BASE_URL);
}

function isRouteConfigured(route) {
  return isConfigured() && Boolean(ENDPOINTS[route]);
}

function buildUrl(route) {
  const path = ENDPOINTS[route];
  if (!API_BASE_URL || !path) {
    throw new Error(
      `[remoteApi] Endpoint "${route}" is not configured. Check src/api/remoteApi.js and VITE_API_BASE_URL.`
    );
  }
  return `${API_BASE_URL}${path}`;
}

function buildHeaders(extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

function shouldRetry(error, attempt, maxRetries) {
  if (attempt >= maxRetries) {
    return false;
  }

  if (error?.name === "AbortError") {
    return Boolean(error.__timeout);
  }

  if (error?.status) {
    return RETRYABLE_STATUS.has(error.status);
  }

  // Network errors from fetch surface without status.
  return true;
}

function computeBackoff(attempt) {
  const exponential = DEFAULT_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * DEFAULT_RETRY_BASE_DELAY_MS;
  return exponential + jitter;
}

async function parseResponseBody(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(
  route,
  {
    method = "POST",
    body,
    headers,
    signal,
    timeout = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_MAX_RETRIES,
  } = {}
) {
  const url = buildUrl(route);

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    const controller = new AbortController();
    let timeoutId;
    let timedOut = false;
    let abortHandler;

    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        abortHandler = () => controller.abort();
        signal.addEventListener("abort", abortHandler, { once: true });
      }
    }

    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeout);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: buildHeaders(headers),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const details = await response.text();
        const error = new Error(
          buildErrorMessage(route, url, response.status, response.statusText, details || "no details")
        );
        error.status = response.status;
        error.statusText = response.statusText;
        error.body = details;
        throw error;
      }

      return await parseResponseBody(response);
    } catch (error) {
      if (timedOut) {
        error.name = "AbortError";
        error.__timeout = true;
      }

      lastError = error;

      if (!shouldRetry(error, attempt, retries)) {
        break;
      }

      await wait(computeBackoff(attempt));
      attempt += 1;
      continue;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (signal && abortHandler) {
        signal.removeEventListener("abort", abortHandler);
      }
    }
  }

  throw lastError;
}

export const remoteApi = {
  baseUrl: API_BASE_URL,
  endpoints: ENDPOINTS,
  isConfigured,
  isRouteConfigured,
  async fetchRealNews(params, options) {
    return request("fetchRealNews", { body: params, ...options });
  },
  async verifyNewsDates(params, options) {
    return request("verifyNewsDates", { body: params, ...options });
  },
  async clearAllNews(options) {
    return request("clearAllNews", { body: {}, ...options });
  },
  async resetSources(options) {
    return request("resetSources", { body: {}, ...options });
  },
  async sendToTelegram(payload, options) {
    return request("sendToTelegram", { body: payload, ...options });
  },
  async sendToWhatsApp(payload, options) {
    return request("sendToWhatsApp", { body: payload, ...options });
  },
  async sendToTeams(payload, options) {
    return request("sendToTeams", { body: payload, ...options });
  },
  async sendToEmail(payload, options) {
    return request("sendToEmail", { body: payload, ...options });
  },
  async generateNews(params, options) {
    return request("generateNews", { body: params, ...options });
  },
};
