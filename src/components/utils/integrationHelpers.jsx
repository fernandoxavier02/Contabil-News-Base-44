import { News } from "@/api/entities";
import { remoteApi } from "@/api/remoteApi";

const IMPORTANCE_LEVELS = ["baixa", "media", "alta"];

function sanitizeString(value, maxLength) {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  if (!maxLength) return text;
  return text.slice(0, maxLength);
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

  payload.title = sanitizeString(payload.title || "Noticia sem titulo", 180);
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

function buildDemoGeneratedNews(params = {}) {
  const today = new Date().toISOString().split("T")[0];
  const category = sanitizeString(params.defaultCategory || params.category, 40) || "contabil";
  const sourceName = sanitizeString(params.sourceName || params.source_name || "Fonte", 120) || "Fonte";
  const titleFallback = sanitizeString(params.title, 180) || `${sourceName} update ${today}`;

  return {
    title: titleFallback,
    summary:
      sanitizeString(
        params.summary ||
          `Local demo content generated for ${sourceName}. Configure generateNews to fetch real data.`,
        800
      ) || titleFallback,
    content:
      sanitizeString(
        params.content ||
          "This article was generated locally because the generateNews endpoint is not configured.",
        4000
      ) || titleFallback,
    category,
    importance: IMPORTANCE_LEVELS.includes(params.importance) ? params.importance : "media",
    tags: ensureArrayOfStrings(
      Array.isArray(params.tags) && params.tags.length > 0 ? params.tags : [category]
    ),
    is_highlighted: Boolean(params.is_highlighted),
    source_name: sourceName,
    external_url: sanitizeString(params.sourceWebsite || params.external_url, 500) || null,
    publication_date: toIsoDate(params.publication_date || today),
  };
}

export async function safeCreateNews(newsData) {
  const payload = normalizeNewsPayload(newsData);
  try {
    return await News.create(payload);
  } catch (error) {
    console.error("[safeCreateNews] Failed to create news entry:", error);
    throw error;
  }
}

export async function generateNewsViaLLM(params) {
  if (!remoteApi.isRouteConfigured("generateNews")) {
    return buildDemoGeneratedNews(params);
  }
  return remoteApi.generateNews(params);
}
