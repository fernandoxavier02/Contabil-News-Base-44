const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

const ENDPOINTS = {
  fetchRealNews:
    import.meta.env.VITE_API_ROUTE_FETCH_REAL_NEWS || "/integrations/news/fetch",
  verifyNewsDates:
    import.meta.env.VITE_API_ROUTE_VERIFY_NEWS_DATES || "/integrations/news/verify-dates",
  clearAllNews:
    import.meta.env.VITE_API_ROUTE_CLEAR_NEWS || "/news/clear",
  resetSources:
    import.meta.env.VITE_API_ROUTE_RESET_SOURCES || "/sources/reset",
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
      `[remoteApi] Endpoint "${route}" não configurado. Verifique src/api/remoteApi.js e VITE_API_BASE_URL.`
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

async function request(route, { method = "POST", body, headers } = {}) {
  const url = buildUrl(route);
  const response = await fetch(url, {
    method,
    headers: buildHeaders(headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `[remoteApi] ${response.status} ${response.statusText} ao acessar ${url}: ${text || "sem detalhes"}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const remoteApi = {
  baseUrl: API_BASE_URL,
  endpoints: ENDPOINTS,
  isConfigured,
  isRouteConfigured,
  async fetchRealNews(params) {
    return request("fetchRealNews", { body: params });
  },
  async verifyNewsDates(params) {
    return request("verifyNewsDates", { body: params });
  },
  async clearAllNews() {
    return request("clearAllNews", { body: {} });
  },
  async resetSources() {
    return request("resetSources", { body: {} });
  },
  async sendToTelegram(payload) {
    return request("sendToTelegram", { body: payload });
  },
  async sendToWhatsApp(payload) {
    return request("sendToWhatsApp", { body: payload });
  },
  async sendToTeams(payload) {
    return request("sendToTeams", { body: payload });
  },
  async sendToEmail(payload) {
    return request("sendToEmail", { body: payload });
  },
  async generateNews(params) {
    return request("generateNews", { body: params });
  },
};
