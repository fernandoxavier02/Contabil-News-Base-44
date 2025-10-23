import { News } from "@/api/entities";
import { remoteApi } from "@/api/remoteApi";

const IMPORTANCE_LEVELS = ["baixa", "media", "alta"];

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
  payload.source_name = sanitizeString(payload.source_name || "Fonte", 120);
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

export async function generateNewsViaLLM(params) {
  if (!remoteApi.isRouteConfigured("generateNews")) {
    throw new Error(
      "Endpoint de geração de notícias não configurado. Ajuste src/api/remoteApi.js para apontar para sua API real."
    );
  }
  return remoteApi.generateNews(params);
}
