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
      const recordId = payload.id || generateId(storageKey.split(":")[1]);
      const existingIndex = data.findIndex((item) => item.id === recordId);
      const baseRecord = existingIndex !== -1 ? data[existingIndex] : undefined;

      const record = normalizeRecord(
        {
          ...(baseRecord || {}),
          ...payload,
          id: baseRecord?.id || recordId,
        },
        defaults
      );

      if (normalize) {
        normalize(record, payload, baseRecord);
      }

      if (existingIndex !== -1) {
        data[existingIndex] = record;
      } else {
        data.push(record);
      }

      saveData(data);
      await delay(DEFAULT_DELAY_MS);
      return clone(record);
    },
    async update(id, changes) {
      const data = loadData();
      const index = data.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error(`Registro nao encontrado (id=${id}).`);
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

function normalizeKeyFragment(value) {
  return String(value ?? "").trim().toLowerCase();
}

function buildNewsIdentity(record = {}) {
  if (record.id) {
    return `id:${record.id}`;
  }

  const title = normalizeKeyFragment(record.title);
  const publication = normalizeKeyFragment(record.publication_date);
  const source = normalizeKeyFragment(record.source_id || record.source_name);

  return `hash:${title}|${publication}|${source}`;
}

async function syncCreatedNews(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const existingRecords = await newsStore.list();
  const knownKeys = new Set(existingRecords.map((item) => buildNewsIdentity(item)));
  const knownIds = new Set(existingRecords.map((item) => item.id).filter(Boolean));
  const created = [];

  for (const item of items) {
    try {
      const identity = buildNewsIdentity(item);
      if (identity && knownKeys.has(identity)) {
        if (item.id && knownIds.has(item.id)) {
          try {
            await newsStore.update(item.id, item);
          } catch (updateError) {
            console.warn("[localDatabase] Failed to update duplicated news entry:", updateError);
          }
        }
        continue;
      }

      const record = await newsStore.create(item);
      created.push(record);

      if (identity) {
        knownKeys.add(identity);
      }
      knownKeys.add(buildNewsIdentity(record));
      if (record.id) {
        knownIds.add(record.id);
      }
    } catch (error) {
      console.warn("[localDatabase] Failed to persist news item returned by API:", error);
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
      console.warn("[localDatabase] Failed to persist source item returned by API:", error);
    }
  }
  return persisted;
}

function buildDemoNewsFromSource(params = {}) {
  const now = new Date();
  const baseTitle = params.source_name || params.sourceName || "Fonte Contabil";
  const category = params.category || params.defaultCategory || "contabil";

  return {
    title: `${baseTitle}: atualizacao de ${now.toLocaleDateString("pt-BR")}`,
    summary:
      params.summary ||
      `Resumo automatico gerado para ${baseTitle}. Utilize este item para validar integracoes de noticias.`,
    content:
      params.content ||
      `Este e um conteudo ficticio criado para o modo de demonstracao. Ajuste o endpoint "fetchRealNews" para receber dados reais do backend.`,
    category,
    importance: "media",
    tags: [category],
    source_name: baseTitle,
    external_url: params.rss_feed_url || params.sourceWebsite || null,
    publication_date: now.toISOString().split("T")[0],
  };
}

async function fetchRealNews(params) {
  if (remoteApi.isRouteConfigured("fetchRealNews")) {
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

  const demoPayload = buildDemoNewsFromSource(params);
  const created = await newsStore.create(demoPayload);
  return {
    data: {
      success: true,
      message:
        "Modo demonstracao: configure o endpoint `fetchRealNews` para consumir noticias reais.",
      created_count: 1,
      created_news: [created],
    },
  };
}

async function verifyNewsDates(params) {
  if (remoteApi.isRouteConfigured("verifyNewsDates")) {
    const data = await remoteApi.verifyNewsDates(params);
    return { data };
  }

  // Fallback local (modo demo): gera um relatorio compatível com a UI
  const records = await newsStore.list();
  const today = new Date().toISOString().split("T")[0];

  // Determinar amostra
  const requestedSample = Number(params?.sample_size);
  const sampleSize = Math.max(
    1,
    Math.min(
      Number.isFinite(requestedSample) ? requestedSample : 10,
      Math.min(50, records.length || 0)
    )
  );
  const sample = records.slice(0, sampleSize);

  // Classificar itens incorretos (datas futuras) na amostra
  const isFuture = (iso) => (iso || "") > today;
  const incorrectItems = sample.filter((item) => isFuture(item.publication_date));
  const correctItems = sample.filter((item) => !isFuture(item.publication_date));

  // Montar resultados detalhados esperados pela UI
  function formatDateISO(d) {
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      return dt.toISOString().split("T")[0];
    } catch {
      return null;
    }
  }

  function daysDiff(aIso, bIso) {
    const a = new Date(aIso);
    const b = new Date(bIso);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    const ms = a.getTime() - b.getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  }

  const results = [];

  // Itens corretos
  for (const item of correctItems) {
    results.push({
      title: item.title,
      saved_date: item.publication_date,
      found_date: item.publication_date, // no demo, usamos a mesma data
      difference_days: 0,
      status: "correct",
      external_url: item.external_url || null,
      source: item.source_name || "local-demo",
      confidence: "medium",
      message:
        "Modo demonstracao: verificação local simulada. Configure `verifyNewsDates` para auditoria real.",
    });
  }

  // Itens incorretos (data futura)
  for (const item of incorrectItems) {
    const saved = item.publication_date;
    const todayIso = today;
    results.push({
      title: item.title,
      saved_date: saved,
      found_date: todayIso, // simulamos que a fonte indica a data de hoje
      difference_days: daysDiff(saved, todayIso),
      status: "incorrect",
      external_url: item.external_url || null,
      source: item.source_name || "local-demo",
      confidence: "low",
      message:
        "Data salva parece estar no futuro em relacao a data atual.",
    });
  }

  const totalVerified = sample.length;
  const incorrectCount = incorrectItems.length;
  const correctCount = Math.max(0, totalVerified - incorrectCount);
  const unableToVerify = 0;
  const accuracy = totalVerified > 0 ? Math.round((correctCount / totalVerified) * 100) : 100;

  // Campos antigos mantidos para compatibilidade (caso outra UI use)
  const invalidAll = records.filter((item) => item.publication_date > today);

  return {
    data: {
      success: true,
      // Novos campos esperados pela UI do DateVerifier
      total_verified: totalVerified,
      correct_dates: correctCount,
      incorrect_dates: incorrectCount,
      unable_to_verify: unableToVerify,
      accuracy_percentage: accuracy,
      summary: {
        recommendation:
          incorrectCount === 0
            ? "Todas as amostras parecem corretas no modo de demonstracao."
            : "Foram encontradas datas possivelmente incorretas. Revise o processo de ingestao de datas.",
      },
      results,

      // Campos de compatibilidade
      total_news: records.length,
      invalid_dates: invalidAll.map((item) => ({
        id: item.id,
        title: item.title,
        publication_date: item.publication_date,
      })),
      message:
        "Modo demonstracao: verificação local simulada. Configure `verifyNewsDates` para auditoria real.",
    },
  };
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
      message: `${existing.length} noticia(s) removidas do armazenamento local.`,
    },
  };
}

async function resetSources() {
  await sourceStore.clear();

  if (!remoteApi.isRouteConfigured("resetSources")) {
    const demoSources = [
      {
        name: "Receita Federal",
        description: "Atualizacoes oficiais sobre legislacao tributaria e fiscal.",
        website: "https://www.gov.br/receitafederal",
        logo_url: "https://logodownload.org/wp-content/uploads/2016/10/receita-federal-logo.png",
        update_method: "rss",
        rss_feed_url: "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/rss",
        is_active: true,
        credibility_level: "alta",
      },
      {
        name: "Conselho Federal de Contabilidade",
        description: "Noticias e resolucoes do CFC para profissionais contabeis.",
        website: "https://cfc.org.br",
        logo_url: "https://cfc.org.br/wp-content/themes/cfc/assets/images/logo.svg",
        update_method: "llm",
        is_active: true,
        credibility_level: "alta",
      },
      {
        name: "Portal Tributario",
        description: "Curadoria de novidades fiscais e trabalhistas.",
        website: "https://www.portaltributario.com.br",
        update_method: "llm",
        is_active: false,
        credibility_level: "media",
      },
    ];

    const created = [];
    for (const source of demoSources) {
      const record = await sourceStore.create(source);
      created.push(record);
    }

    return {
      data: {
        success: true,
        message:
          "Modo demonstracao: fontes de exemplo recriadas. Configure `resetSources` para sincronizar com sua API.",
        sources: created,
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
  if (remoteApi.isRouteConfigured("sendToTelegram")) {
    const data = await remoteApi.sendToTelegram(payload);
    return { data };
  }

  return {
    data: {
      success: true,
      message:
        "Modo demonstracao: nenhuma mensagem real enviada. Configure `sendToTelegram` para habilitar o disparo.",
      echo: payload,
    },
  };
}

async function sendToWhatsApp(payload) {
  if (remoteApi.isRouteConfigured("sendToWhatsApp")) {
    const data = await remoteApi.sendToWhatsApp(payload);
    return { data };
  }

  return {
    data: {
      success: true,
      message:
        "Modo demonstracao: nenhuma mensagem real enviada. Configure `sendToWhatsApp` para habilitar o disparo.",
      echo: payload,
    },
  };
}

async function sendToTeams(payload) {
  if (remoteApi.isRouteConfigured("sendToTeams")) {
    const data = await remoteApi.sendToTeams(payload);
    return { data };
  }

  return {
    data: {
      success: true,
      message:
        "Modo demonstracao: nenhuma mensagem real enviada. Configure `sendToTeams` para habilitar o disparo.",
      echo: payload,
    },
  };
}

async function sendToEmail(payload) {
  if (remoteApi.isRouteConfigured("sendToEmail")) {
    const data = await remoteApi.sendToEmail(payload);
    return { data };
  }

  return {
    data: {
      success: true,
      message:
        "Modo demonstracao: nenhuma mensagem real enviada. Configure `sendToEmail` para habilitar o disparo.",
      echo: payload,
    },
  };
}

async function generateNewsViaLLM(params) {
  if (remoteApi.isRouteConfigured("generateNews")) {
    return remoteApi.generateNews(params);
  }

  const demoNews = buildDemoNewsFromSource(params);
  return {
    ...demoNews,
    importance: params.importance || "media",
  };
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
