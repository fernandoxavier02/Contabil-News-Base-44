import { readCollection, writeCollection, clone, generateId, delay } from "@/lib/localStore";
import { remoteApi } from "./remoteApi";

const STORAGE_KEYS = {
  news: "contabilNews:news",
  sources: "contabilNews:sources",
  telegramConfigs: "contabilNews:telegramConfigs",
  whatsappConfigs: "contabilNews:whatsappConfigs",
  teamsConfigs: "contabilNews:teamsConfigs",
  emailConfigs: "contabilNews:emailConfigs",
};

const DEFAULT_DELAY_MS = 120;

function load(key) {
  return readCollection(key, []);
}

function persist(key, data) {
  writeCollection(key, data);
}

function matchesCriteria(item, criteria = {}) {
  return Object.entries(criteria).every(([field, expected]) => {
    if (expected === undefined || expected === null) return true;

    const value = item[field];
    if (typeof expected === "function") {
      return expected(value, item);
    }
    if (Array.isArray(expected)) {
      return expected.includes(value);
    }
    if (typeof expected === "object") {
      if ("contains" in expected) {
        return String(value || "")
          .toLowerCase()
          .includes(String(expected.contains).toLowerCase());
      }
      if ("equals" in expected) {
        return value === expected.equals;
      }
    }
    return value === expected;
  });
}

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;

  const dateA = Date.parse(a);
  const dateB = Date.parse(b);
  const datesValid = !Number.isNaN(dateA) && !Number.isNaN(dateB);
  if (datesValid) {
    return dateA - dateB;
  }

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b));
}

function sortRecords(records, order, fallbackOrder) {
  const sortKey = order || fallbackOrder;
  if (!sortKey) return [...records];

  const desc = sortKey.startsWith("-");
  const field = desc ? sortKey.slice(1) : sortKey;
  const direction = desc ? -1 : 1;

  return [...records].sort((left, right) => direction * compareValues(left[field], right[field]));
}

function normalizeRecord(record, defaults = {}) {
  const now = new Date().toISOString();
  if (!record.created_at) record.created_at = now;
  if (!record.created_date) record.created_date = record.created_at;
  record.updated_at = now;
  return { ...defaults, ...record };
}

function createStore(storageKey, options = {}) {
  const { defaultOrder, defaults, normalize } = options;

  const loadData = () => load(storageKey);
  const saveData = (data) => persist(storageKey, data);

  return {
    async list(order, limit) {
      const records = sortRecords(loadData(), order, defaultOrder);
      const sliced = typeof limit === "number" ? records.slice(0, limit) : records;
      await delay(DEFAULT_DELAY_MS);
      return clone(sliced);
    },
    async filter(criteria = {}, opts = {}) {
      const filtered = loadData().filter((item) => matchesCriteria(item, criteria));
      const sorted = sortRecords(filtered, opts.order, defaultOrder);
      const sliced = typeof opts.limit === "number" ? sorted.slice(0, opts.limit) : sorted;
      await delay(DEFAULT_DELAY_MS);
      return clone(sliced);
    },
    async get(id) {
      const record = loadData().find((item) => item.id === id);
      await delay(DEFAULT_DELAY_MS);
      return record ? clone(record) : null;
    },
    async create(payload) {
      const data = loadData();
      const record = normalizeRecord(
        {
          id: payload.id || generateId(storageKey.split(":")[1]),
          ...payload,
        },
        defaults
      );

      if (normalize) {
        normalize(record, payload);
      }

      data.push(record);
      saveData(data);
      await delay(DEFAULT_DELAY_MS);
      return clone(record);
    },
    async update(id, changes) {
      const data = loadData();
      const index = data.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error(`Registro não encontrado (id=${id}).`);
      }

      const updated = normalizeRecord(
        {
          ...data[index],
          ...changes,
          id: data[index].id,
        },
        defaults
      );

      if (normalize) {
        normalize(updated, changes, data[index]);
      }

      data[index] = updated;
      saveData(data);
      await delay(DEFAULT_DELAY_MS);
      return clone(updated);
    },
    async delete(id) {
      const data = loadData();
      const index = data.findIndex((item) => item.id === id);
      if (index === -1) return false;
      data.splice(index, 1);
      saveData(data);
      await delay(DEFAULT_DELAY_MS);
      return true;
    },
    async clear() {
      saveData([]);
      await delay(DEFAULT_DELAY_MS);
    },
    async count() {
      return loadData().length;
    },
  };
}

const newsStore = createStore(STORAGE_KEYS.news, {
  defaultOrder: "-created_at",
  normalize(record) {
    if (!record.publication_date) {
      record.publication_date = record.created_at.split("T")[0];
    }
    if (!Array.isArray(record.tags)) {
      record.tags = [];
    }
  },
});

const sourceStore = createStore(STORAGE_KEYS.sources, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    record.update_method = record.update_method || "manual";
    record.credibility_level = record.credibility_level || "media";
  },
});

const telegramStore = createStore(STORAGE_KEYS.telegramConfigs, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    record.send_automatically = Boolean(record.send_automatically);
    record.min_importance = record.min_importance || "media";
    record.category = record.category || "geral";
  },
});

const whatsappStore = createStore(STORAGE_KEYS.whatsappConfigs, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    record.min_importance = record.min_importance || "media";
    record.category = record.category || "geral";
  },
});

const teamsStore = createStore(STORAGE_KEYS.teamsConfigs, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    record.min_importance = record.min_importance || "media";
    record.category = record.category || "geral";
    record.mention_users = Array.isArray(record.mention_users) ? record.mention_users : [];
  },
});

const emailStore = createStore(STORAGE_KEYS.emailConfigs, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    record.min_importance = record.min_importance || "media";
    record.category = record.category || "geral";
    record.to_addresses = Array.isArray(record.to_addresses) ? record.to_addresses : [];
    record.cc_addresses = Array.isArray(record.cc_addresses) ? record.cc_addresses : [];
    record.bcc_addresses = Array.isArray(record.bcc_addresses) ? record.bcc_addresses : [];
  },
});

function ensureRemote(route) {
  if (!remoteApi.isRouteConfigured(route)) {
    throw new Error(
      `[integração] Endpoint "${route}" não configurado. Ajuste src/api/remoteApi.js e defina VITE_API_BASE_URL.`
    );
  }
}

async function syncCreatedNews(items = []) {
  if (!Array.isArray(items)) return [];

  const created = [];
  for (const item of items) {
    try {
      const record = await newsStore.create(item);
      created.push(record);
    } catch (error) {
      console.warn("[localDatabase] Falha ao salvar notícia retornada pela API:", error);
    }
  }
  return created;
}

async function syncSources(items = []) {
  if (!Array.isArray(items)) return [];

  const persisted = [];
  for (const item of items) {
    try {
      const record = await sourceStore.create(item);
      persisted.push(record);
    } catch (error) {
      console.warn("[localDatabase] Falha ao salvar fonte retornada pela API:", error);
    }
  }
  return persisted;
}

async function fetchRealNews(params) {
  ensureRemote("fetchRealNews");
  const data = await remoteApi.fetchRealNews(params);
  if (Array.isArray(data?.created_news)) {
    const created = await syncCreatedNews(data.created_news);
    return {
      data: {
        ...data,
        created_news: created,
      },
    };
  }
  return { data };
}

async function verifyNewsDates(params) {
  ensureRemote("verifyNewsDates");
  const data = await remoteApi.verifyNewsDates(params);
  return { data };
}

async function clearAllNews() {
  const existing = await newsStore.list();
  await newsStore.clear();

  if (remoteApi.isRouteConfigured("clearAllNews")) {
    await remoteApi.clearAllNews();
  }

  return {
    data: {
      success: true,
      deleted_count: existing.length,
      message: `${existing.length} notícia(s) removidas do armazenamento local.`,
    },
  };
}

async function resetSources() {
  await sourceStore.clear();

  if (!remoteApi.isRouteConfigured("resetSources")) {
    return {
      data: {
        success: true,
        message:
          "Fontes locais limpas. Configure sua API e atualize manualmente para sincronizar fontes reais.",
        sources: [],
      },
    };
  }

  const data = await remoteApi.resetSources();
  const synced = await syncSources(data?.sources);
  return {
    data: {
      success: true,
      message: data?.message || `${synced.length} fonte(s) sincronizadas a partir da API.`,
      sources: synced,
    },
  };
}

async function sendToTelegram(payload) {
  ensureRemote("sendToTelegram");
  const data = await remoteApi.sendToTelegram(payload);
  return { data };
}

async function sendToWhatsApp(payload) {
  ensureRemote("sendToWhatsApp");
  const data = await remoteApi.sendToWhatsApp(payload);
  return { data };
}

async function sendToTeams(payload) {
  ensureRemote("sendToTeams");
  const data = await remoteApi.sendToTeams(payload);
  return { data };
}

async function sendToEmail(payload) {
  ensureRemote("sendToEmail");
  const data = await remoteApi.sendToEmail(payload);
  return { data };
}

async function generateNewsViaLLM(params) {
  ensureRemote("generateNews");
  return remoteApi.generateNews(params);
}

export const localDb = {
  News: newsStore,
  Source: sourceStore,
  TelegramConfig: telegramStore,
  WhatsAppConfig: whatsappStore,
  TeamsConfig: teamsStore,
  EmailConfig: emailStore,
};

export const localFunctions = {
  fetchRealNews,
  verifyNewsDates,
  clearAllNews,
  resetSources,
  sendToTelegram,
  sendToWhatsApp,
  sendToTeams,
  sendToEmail,
  generateNewsViaLLM,
};

export const localAuth = {
  async getCurrentUser() {
    await delay(DEFAULT_DELAY_MS);
    return null;
  },
};
