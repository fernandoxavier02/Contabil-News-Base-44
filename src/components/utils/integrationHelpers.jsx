import { News } from "@/api/entities";

const IMPORTANCE_LEVELS = ["baixa", "media", "alta"];

const CATEGORY_RULES = [
  { category: "tributaria", keywords: ["tribut", "fisco", "receita", "perse", "icms", "pis", "cofins"] },
  { category: "folha_pagamento", keywords: ["folha", "esocial", "trabalh", "inss", "fgts", "sindical"] },
  { category: "reforma_tributaria", keywords: ["reforma tribut", "ibs", "cbs", "iva dual"] },
  { category: "ifrs", keywords: ["ifrs", "iasb", "norma internacional"] },
  { category: "usgaap", keywords: ["gaap", "fasb", "sec"] },
  { category: "contabil", keywords: ["contáb", "balanço", "cfc", "cpc", "auditoria"] },
];

function sanitizeString(value, maxLength) {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  return maxLength ? text.slice(0, maxLength) : text;
}

function ensureArrayOfStrings(value, maxItems = 8, maxLength = 40) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function toIsoDate(value) {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  return parsed.toISOString().split("T")[0];
}

function normalizeNewsPayload(data) {
  const payload = { ...data };

  payload.title = sanitizeString(payload.title || "Notícia sem título", 180);
  payload.summary = sanitizeString(payload.summary || payload.title, 800);
  payload.content = sanitizeString(payload.content || payload.summary, 4000);
  payload.category = sanitizeString(payload.category, 40) || "contabil";
  payload.importance = IMPORTANCE_LEVELS.includes(payload.importance) ? payload.importance : "media";
  payload.tags = ensureArrayOfStrings(payload.tags);
  payload.is_highlighted = Boolean(payload.is_highlighted);
  payload.source_name = sanitizeString(payload.source_name || "Fonte Local", 120);
  payload.external_url = sanitizeString(payload.external_url, 500) || null;
  payload.publication_date = toIsoDate(payload.publication_date);

  return payload;
}

export async function safeCreateNews(newsData) {
  const payload = normalizeNewsPayload(newsData);
  try {
    return await News.create(payload);
  } catch (error) {
    console.error("[safeCreateNews] Erro ao criar notícia:", error);
    throw error;
  }
}

function guessCategory(defaultCategory, topic, description) {
  const base = sanitizeString(topic || description || "", 200).toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => base.includes(keyword))) {
      return rule.category;
    }
  }

  return defaultCategory || "contabil";
}

function guessImportance(topic, description) {
  const text = `${topic} ${description}`.toLowerCase();
  if (["prazo", "obrig", "penal", "multa", "urg", "vigência"].some((word) => text.includes(word))) {
    return "alta";
  }
  if (["evento", "webinar", "congresso", "seminário", "participar"].some((word) => text.includes(word))) {
    return "baixa";
  }
  return "media";
}

function buildTags(category, topic, sourceName) {
  const tags = new Set();
  if (category) tags.add(category);

  sanitizeString(topic, 200)
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 3)
    .forEach((word) => tags.add(word));

  if (sourceName) {
    tags.add(sourceName.split(/\s+/)[0].toLowerCase());
  }

  return Array.from(tags);
}

function capitalise(text) {
  const safe = sanitizeString(text);
  if (!safe) return "";
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

function createSummary(topic, sourceName) {
  const cleanTopic = capitalise(topic);
  if (!cleanTopic) {
    return "Atualização gerada automaticamente para o fluxo de testes do Contábil News.";
  }
  return `${cleanTopic}. Conteúdo preparado com base nas referências de ${sourceName || "nossa curadoria"}.`;
}

function createContent(topic, sourceName, description, website) {
  const paragraphs = [
    capitalise(topic) ||
      "Esta notícia foi gerada pelo modo independente do Contábil News para auxiliar em testes e protótipos.",
  ];

  if (description) {
    paragraphs.push(`Fonte utilizada: ${description}`);
  }

  if (website) {
    paragraphs.push(`Consulte mais detalhes em ${website}.`);
  }

  paragraphs.push(
    "Ajuste o texto conforme necessário e substitua pelos dados reais ao conectar seu próprio backend ou integrações."
  );

  return paragraphs.join("\n\n");
}

export async function generateNewsViaLLM({
  sourceName,
  sourceDescription = "",
  topic = "",
  defaultCategory = "contabil",
  sourceWebsite = "",
}) {
  const resolvedTopic =
    sanitizeString(topic, 200) ||
    `novidades recentes do cenário ${defaultCategory === "geral" ? "contábil" : defaultCategory}`;

  const category = guessCategory(defaultCategory, resolvedTopic, sourceDescription);
  const importance = guessImportance(resolvedTopic, sourceDescription);
  const tags = buildTags(category, resolvedTopic, sourceName);
  const publication_date = new Date().toISOString().split("T")[0];

  return {
    title: sanitizeString(`${sourceName || "Fonte"}: ${capitalise(resolvedTopic)}`, 180),
    summary: createSummary(resolvedTopic, sourceName),
    content: createContent(resolvedTopic, sourceName, sourceDescription, sourceWebsite),
    category,
    importance,
    tags,
    is_highlighted: importance === "alta",
    source_name: sanitizeString(sourceName || "Fonte Local", 120),
    publication_date,
    external_url: sourceWebsite || null,
  };
}
