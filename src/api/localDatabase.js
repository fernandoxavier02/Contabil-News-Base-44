import { readCollection, writeCollection, clone, generateId, delay } from "@/lib/localStore";

const STORAGE_KEYS = {
  news: "contabilNews:news",
  sources: "contabilNews:sources",
  telegramConfigs: "contabilNews:telegramConfigs",
  whatsappConfigs: "contabilNews:whatsappConfigs",
  teamsConfigs: "contabilNews:teamsConfigs",
  emailConfigs: "contabilNews:emailConfigs",
};

function createTimestamp(isoDate) {
  return {
    created_at: `${isoDate}T09:00:00.000Z`,
    created_date: `${isoDate}T09:00:00.000Z`,
    updated_at: `${isoDate}T09:00:00.000Z`,
  };
}

const DEFAULT_DATA = {
  news: [
    {
      id: "news_local_launch",
      title: "Contábil News agora funciona offline",
      summary: "O projeto foi adaptado para rodar em modo local, sem dependências da plataforma Base44, permitindo customizações livres.",
      content:
        "Com a nova camada de armazenamento local, você pode testar fluxos, ajustar componentes e experimentar estratégias de curadoria sem precisar de uma conta na Base44. Todos os dados ficam salvos no navegador e podem ser redefinidos a qualquer momento.",
      category: "contabil",
      importance: "media",
      tags: ["contabil", "produto", "release"],
      source_name: "Equipe Contábil News",
      publication_date: "2025-01-15",
      external_url: "https://contabil-news.local/noticia/offline",
      is_highlighted: true,
      ...createTimestamp("2025-01-15"),
    },
    {
      id: "news_perse_2025",
      title: "Receita Federal publica novas orientações do PERSE",
      summary:
        "Instrução Normativa consolida procedimentos para adesão ao Programa Emergencial de Retomada do Setor de Eventos (PERSE) em 2025.",
      content:
        "A Receita Federal atualizou o manual do PERSE com prazos revisados para comprovação de CNAE, reforçando a necessidade de documentação digitalizada e assinatura eletrônica. Escritórios contábeis devem orientar clientes sobre o envio até o último dia útil de março.",
      category: "tributaria",
      importance: "alta",
      tags: ["tributaria", "perse", "receita federal"],
      source_name: "Receita Federal",
      publication_date: "2025-01-12",
      external_url: "https://www.gov.br/receitafederal/pt-br/perse",
      is_highlighted: true,
      ...createTimestamp("2025-01-12"),
    },
    {
      id: "news_esocial",
      title: "eSocial simplifica eventos de SST para pequenas empresas",
      summary:
        "Nova versão do layout dispensa envio de alguns eventos duplicados e traz validações automáticas para empregadores do Simples Nacional.",
      content:
        "A nota técnica 08/2024 do eSocial começa a valer em fevereiro. Além da simplificação, o governo incluiu checagens de consistência que alertam sobre afastamentos sem CAT e pendências de ASO. Recomenda-se revisar processos internos de SST.",
      category: "folha_pagamento",
      importance: "media",
      tags: ["folha_pagamento", "esocial", "sst"],
      source_name: "Portal eSocial",
      publication_date: "2025-01-08",
      external_url: "https://www.gov.br/esocial",
      is_highlighted: false,
      ...createTimestamp("2025-01-08"),
    },
  ],
  sources: [
    {
      id: "source_receita",
      name: "Receita Federal",
      description: "Atualizações oficiais sobre legislação fiscal, tributos e obrigações acessórias.",
      website: "https://www.gov.br/receitafederal",
      logo_url: "",
      update_method: "rss",
      rss_feed_url: "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/rss.xml",
      api_endpoint: "",
      is_active: true,
      credibility_level: "alta",
      ...createTimestamp("2025-01-10"),
    },
    {
      id: "source_cfoc",
      name: "CFC - Conselho Federal de Contabilidade",
      description: "Comunicados e deliberações do Conselho Federal de Contabilidade.",
      website: "https://cfc.org.br",
      logo_url: "",
      update_method: "llm",
      rss_feed_url: "",
      api_endpoint: "",
      is_active: true,
      credibility_level: "alta",
      ...createTimestamp("2025-01-09"),
    },
    {
      id: "source_forum",
      name: "Fórum Tributário Independente",
      description: "Seleção manual de análises e opiniões sobre reforma tributária.",
      website: "",
      logo_url: "",
      update_method: "llm",
      rss_feed_url: "",
      api_endpoint: "",
      is_active: false,
      credibility_level: "media",
      ...createTimestamp("2025-01-07"),
    },
  ],
  telegramConfigs: [
    {
      id: "telegram_default",
      bot_token: "000000:LOCAL-SAMPLE-TOKEN",
      category: "geral",
      channel_id: "@contabil_news_demo",
      message_thread_id: "",
      channel_name: "Contábil News · Telegram",
      is_active: true,
      min_importance: "media",
      send_automatically: false,
      summary_footer: "Mensagem enviada do ambiente local Contábil News.",
      use_ai_triage: false,
      ...createTimestamp("2025-01-11"),
    },
  ],
  whatsappConfigs: [
    {
      id: "whatsapp_default",
      account_name: "Contábil Bot",
      target_number: "+55 11 90000-0000",
      category: "geral",
      min_importance: "media",
      is_active: false,
      send_automatically: false,
      summary_footer: "",
      ...createTimestamp("2025-01-11"),
    },
  ],
  teamsConfigs: [
    {
      id: "teams_default",
      team_name: "Canal Fiscal",
      webhook_url: "https://contabil-news.local/webhook/teams",
      category: "geral",
      min_importance: "media",
      mention_users: ["tributos@empresa.com.br"],
      is_active: false,
      ...createTimestamp("2025-01-11"),
    },
  ],
  emailConfigs: [
    {
      id: "email_default",
      list_name: "Contabilidade Interna",
      to_addresses: ["financeiro@empresa.com.br"],
      cc_addresses: [],
      bcc_addresses: [],
      category: "geral",
      min_importance: "media",
      is_active: true,
      send_automatically: false,
      ...createTimestamp("2025-01-11"),
    },
  ],
};

const DEFAULT_DELAY_MS = 120;

function matchesCriteria(item, criteria = {}) {
  return Object.entries(criteria).every(([key, value]) => {
    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value === "function") {
      return value(item[key], item);
    }

    if (Array.isArray(value)) {
      return value.includes(item[key]);
    }

    if (typeof value === "object") {
      if ("contains" in value) {
        return String(item[key] || "").toLowerCase().includes(String(value.contains).toLowerCase());
      }
      if ("equals" in value) {
        return item[key] === value.equals;
      }
    }

    return item[key] === value;
  });
}

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;

  const aDate = Date.parse(a);
  const bDate = Date.parse(b);

  if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
    return aDate - bDate;
  }

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b));
}

function sortRecords(records, order, fallbackOrder) {
  const sort = order || fallbackOrder;
  if (!sort) {
    return [...records];
  }

  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  const direction = desc ? -1 : 1;

  return [...records].sort((left, right) => direction * compareValues(left[field], right[field]));
}

function normalizeBaseRecord(record, defaults = {}) {
  const now = new Date().toISOString();
  if (!record.created_at) record.created_at = now;
  if (!record.created_date) record.created_date = record.created_at;
  record.updated_at = now;
  return { ...defaults, ...record };
}

function createStore(storageKey, defaults, options = {}) {
  const { defaultOrder } = options;

  function load() {
    return readCollection(storageKey, defaults);
  }

  function persist(data) {
    writeCollection(storageKey, data);
  }

  return {
    async list(order, limit) {
      const records = sortRecords(load(), order, defaultOrder);
      const sliced = typeof limit === "number" ? records.slice(0, limit) : records;
      await delay(DEFAULT_DELAY_MS);
      return clone(sliced);
    },
    async filter(criteria = {}, opts = {}) {
      const records = load().filter((item) => matchesCriteria(item, criteria));
      const sorted = sortRecords(records, opts.order, defaultOrder);
      const sliced = typeof opts.limit === "number" ? sorted.slice(0, opts.limit) : sorted;
      await delay(DEFAULT_DELAY_MS);
      return clone(sliced);
    },
    async get(id) {
      const record = load().find((item) => item.id === id);
      await delay(DEFAULT_DELAY_MS);
      return record ? clone(record) : null;
    },
    async create(payload) {
      const data = load();
      const record = normalizeBaseRecord(
        {
          id: payload.id || generateId(storageKey.split(":")[1]),
          ...payload,
        },
        options.defaults || {}
      );

      if (options.normalize) {
        options.normalize(record, payload);
      }

      data.push(record);
      persist(data);
      await delay(DEFAULT_DELAY_MS);
      return clone(record);
    },
    async update(id, changes) {
      const data = load();
      const index = data.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error(`Registro não encontrado (id=${id})`);
      }

      const updated = normalizeBaseRecord(
        {
          ...data[index],
          ...changes,
          id: data[index].id,
        },
        options.defaults || {}
      );

      if (options.normalize) {
        options.normalize(updated, changes, data[index]);
      }

      data[index] = updated;
      persist(data);
      await delay(DEFAULT_DELAY_MS);
      return clone(updated);
    },
    async delete(id) {
      const data = load();
      const index = data.findIndex((item) => item.id === id);
      if (index === -1) return false;
      data.splice(index, 1);
      persist(data);
      await delay(DEFAULT_DELAY_MS);
      return true;
    },
    async clear() {
      persist([]);
      await delay(DEFAULT_DELAY_MS);
    },
    async reset() {
      persist(clone(defaults));
      await delay(DEFAULT_DELAY_MS);
      return this.list(defaultOrder);
    },
    async count() {
      return load().length;
    },
  };
}

const newsStore = createStore(STORAGE_KEYS.news, DEFAULT_DATA.news, {
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

const sourceStore = createStore(STORAGE_KEYS.sources, DEFAULT_DATA.sources, {
  defaultOrder: "-created_at",
  normalize(record) {
    if (!record.update_method) record.update_method = "llm";
    if (!record.credibility_level) record.credibility_level = "media";
    record.is_active = Boolean(record.is_active);
  },
});

const telegramStore = createStore(STORAGE_KEYS.telegramConfigs, DEFAULT_DATA.telegramConfigs, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    record.send_automatically = Boolean(record.send_automatically);
    if (!record.category) record.category = "geral";
    if (!record.min_importance) record.min_importance = "media";
    if (!record.summary_footer) record.summary_footer = "";
  },
});

const whatsappStore = createStore(STORAGE_KEYS.whatsappConfigs, DEFAULT_DATA.whatsappConfigs, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    if (!record.category) record.category = "geral";
    if (!record.min_importance) record.min_importance = "media";
  },
});

const teamsStore = createStore(STORAGE_KEYS.teamsConfigs, DEFAULT_DATA.teamsConfigs, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    if (!record.category) record.category = "geral";
    if (!record.min_importance) record.min_importance = "media";
    if (!Array.isArray(record.mention_users)) {
      record.mention_users = [];
    }
  },
});

const emailStore = createStore(STORAGE_KEYS.emailConfigs, DEFAULT_DATA.emailConfigs, {
  defaultOrder: "-created_at",
  normalize(record) {
    record.is_active = Boolean(record.is_active);
    if (!record.category) record.category = "geral";
    if (!record.min_importance) record.min_importance = "media";
    record.to_addresses = Array.isArray(record.to_addresses) ? record.to_addresses : [];
    record.cc_addresses = Array.isArray(record.cc_addresses) ? record.cc_addresses : [];
    record.bcc_addresses = Array.isArray(record.bcc_addresses) ? record.bcc_addresses : [];
  },
});

function pickRandom(array, maxItems) {
  const safe = array.slice(0, maxItems);
  for (let i = safe.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [safe[i], safe[j]] = [safe[j], safe[i]];
  }
  return safe;
}

function chooseImportance(topic = "") {
  const normalized = topic.toLowerCase();
  if (normalized.includes("prazo") || normalized.includes("obrig") || normalized.includes("perse")) {
    return "alta";
  }
  if (normalized.includes("evento") || normalized.includes("congresso")) {
    return "baixa";
  }
  return "media";
}

function buildTags(category, topic = "", sourceName = "") {
  const tags = new Set();
  if (category) tags.add(category);
  topic
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 3)
    .forEach((word) => tags.add(word.toLowerCase()));
  if (sourceName) {
    tags.add(sourceName.split(/\s+/)[0].toLowerCase());
  }
  return Array.from(tags);
}

async function clearAllNews() {
  const current = await newsStore.list();
  await newsStore.clear();
  return {
    data: {
      success: true,
      deleted_count: current.length,
      message: `${current.length} notícia(s) removidas do armazenamento local.`,
    },
  };
}

async function resetSources() {
  const data = await sourceStore.reset();
  return {
    data: {
      success: true,
      message: `${data.length} fonte(s) restauradas para o conjunto padrão.`,
      sources: data,
    },
  };
}

async function fetchRealNews(params) {
  const {
    source_id: sourceId,
    source_name: sourceName,
    category = "contabil",
    rss_feed_url: rssUrl,
  } = params || {};

  const topic = params?.topic || `tendências recentes em ${category}`;
  const importance = chooseImportance(topic);
  const publicationDate = new Date().toISOString().split("T")[0];

  const news = await newsStore.create({
    title: `${sourceName || "Fonte"} destaca ${topic}`,
    summary: `Resumo automático sobre ${topic}, gerado a partir da fonte ${sourceName || sourceId || "local"}.`,
    content: `Esta notícia foi gerada localmente para representar uma importação via RSS. Ajuste livremente o conteúdo, categoria e tags para refletir seu cenário real.\n\nFonte original: ${rssUrl || "arquivo local"}.`,
    category,
    importance,
    tags: buildTags(category, topic, sourceName),
    source_name: sourceName || "Fonte Local",
    source_id: sourceId,
    publication_date: publicationDate,
    external_url: rssUrl || null,
    is_highlighted: importance === "alta",
  });

  return {
    data: {
      success: true,
      created_count: 1,
      created_news: [news],
    },
  };
}

async function verifyNewsDates({ sample_size: sampleSize = 10 } = {}) {
  const allNews = await newsStore.list("-created_at");
  const totalSamples = Math.min(sampleSize, allNews.length);
  const sample = pickRandom(allNews, totalSamples);

  let correct = 0;
  let incorrect = 0;
  let unable = 0;

  const results = sample.map((item) => {
    if (!item.publication_date) {
      unable += 1;
      return {
        title: item.title,
        status: "unable_to_verify",
        saved_date: null,
        found_date: null,
        difference_days: null,
        message: "Notícia sem data de publicação definida.",
        external_url: item.external_url,
      };
    }

    const saved = item.publication_date;
    const savedTime = Date.parse(saved);
    const createdTime = Date.parse(item.created_date);
    const differenceDays = Math.round((createdTime - savedTime) / (1000 * 60 * 60 * 24));

    if (Number.isFinite(differenceDays) && Math.abs(differenceDays) <= 2) {
      correct += 1;
      return {
        title: item.title,
        status: "correct",
        saved_date: saved,
        found_date: saved,
        difference_days: 0,
        confidence: "high",
        message: "Data consistente com o registro criado.",
        external_url: item.external_url,
      };
    }

    incorrect += 1;
    return {
      title: item.title,
      status: "incorrect",
      saved_date: saved,
      found_date: new Date(createdTime).toISOString().split("T")[0],
      difference_days: differenceDays,
      confidence: "medium",
      message: "Data divergente do momento de criação. Revise a fonte original.",
      external_url: item.external_url,
    };
  });

  const totalVerified = results.length;
  const accuracy = totalVerified === 0 ? 100 : Math.round((correct / totalVerified) * 100);
  const summary =
    incorrect === 0
      ? {
          recommendation: "Nenhuma divergência identificada. Continue monitorando periodicamente.",
        }
      : {
          recommendation:
            "Existe(m) divergência(s) entre a data salva e a encontrada. Valide as notícias sinalizadas e ajuste a fonte, se necessário.",
        };

  return {
    data: {
      total_verified: totalVerified,
      correct_dates: correct,
      incorrect_dates: incorrect,
      unable_to_verify: unable,
      accuracy_percentage: accuracy,
      summary,
      results,
    },
  };
}

function synthesizeSendResponse(channel, targetLabel, news) {
  return {
    success: true,
    message: `Mensagem simulada enviada para ${targetLabel}.`,
    preview: {
      channel,
      title: news.title,
      publication_date: news.publication_date,
      importance: news.importance,
    },
  };
}

async function sendToTelegram({ news, telegramConfig, useAiTriage }) {
  await delay(200);
  return {
    data: {
      ...synthesizeSendResponse(
        "telegram",
        telegramConfig?.channel_name || telegramConfig?.channel_id || "canal sem nome",
        news
      ),
      aiAnalysis: useAiTriage
        ? {
            approved: true,
            reason: "Triagem local aprovada com base na importância e categoria.",
          }
        : null,
    },
  };
}

async function sendToWhatsApp({ news, whatsappConfig, useAiTriage }) {
  await delay(200);
  return {
    data: {
      ...synthesizeSendResponse(
        "whatsapp",
        whatsappConfig?.target_number || whatsappConfig?.account_name || "destinatário",
        news
      ),
      aiAnalysis: useAiTriage
        ? {
            approved: true,
            reason: "Conteúdo classificado como relevante para o envio.",
          }
        : null,
    },
  };
}

async function sendToTeams({ news, teamsConfig, useAiTriage }) {
  await delay(200);
  return {
    data: {
      ...synthesizeSendResponse(
        "teams",
        teamsConfig?.team_name || teamsConfig?.webhook_url || "canal Teams",
        news
      ),
      aiAnalysis: useAiTriage
        ? {
            approved: true,
            reason: "Resumo local confirmou aderência ao canal.",
          }
        : null,
    },
  };
}

async function sendToEmail({ news, emailConfig, useAiTriage }) {
  await delay(200);
  const recipients = (emailConfig?.to_addresses || []).join(", ") || "lista de emails";
  return {
    data: {
      ...synthesizeSendResponse("email", recipients, news),
      aiAnalysis: useAiTriage
        ? {
            approved: true,
            reason: "Newsletter simulada aprovada com base na importância mínima.",
          }
        : null,
    },
  };
}

async function invokeLocalLLM({ topic, sourceName, category }) {
  const importance = chooseImportance(topic);
  const publicationDate = new Date().toISOString().split("T")[0];
  const tags = buildTags(category, topic, sourceName);

  return {
    title: `${topic.charAt(0).toUpperCase()}${topic.slice(1)} (${sourceName})`,
    summary: `Resumo automático sobre ${topic}, criado para auxiliar nos testes locais da aplicação.`,
    content: `Esta notícia é um conteúdo gerado localmente para evitar dependências externas. Ajuste o texto conforme necessário para o seu fluxo de trabalho.\n\nCategoria: ${category}.`,
    category,
    importance,
    importance_analysis: {
      creates_new_obligation: importance === "alta",
      urgent_deadline: importance === "alta",
      universal_impact: importance === "alta",
      changes_mandatory_rule: false,
      only_informative: importance === "baixa",
    },
    tags,
    is_highlighted: importance === "alta",
    publication_date: publicationDate,
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
  invokeLocalLLM,
};

export const localAuth = {
  async getCurrentUser() {
    await delay(60);
    return {
      id: "user_local",
      email: "contabil@news.local",
      name: "Usuário Local",
    };
  },
};
