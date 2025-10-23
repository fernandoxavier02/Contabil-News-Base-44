import { InvokeLLM } from "@/api/integrations";
import { News } from "@/api/entities";
import { retry, createRateLimiter } from "./retry";

let llmDownUntil = 0;
function isLLMAvailable() {
  return Date.now() >= llmDownUntil;
}
function markLLMDown(minutes = 5) {
  llmDownUntil = Date.now() + minutes * 60 * 1000;
}

const llmLimiter = createRateLimiter(1400);

export async function invokeLLMWithRetry({ prompt, response_json_schema }) {
  await llmLimiter();
  const res = await retry(
    () => InvokeLLM({ prompt, response_json_schema }),
    { retries: 3, baseDelayMs: 900, factor: 2 }
  );
  return res;
}

function normalizeNewsPayload(data) {
  const safe = { ...data };
  safe.title = String(safe.title || "").slice(0, 200).trim();
  safe.summary = String(safe.summary || "").slice(0, 800).trim();

  if (safe.content) {
    safe.content = String(safe.content || "").slice(0, 4000);
  }

  if (Array.isArray(safe.tags)) {
    safe.tags = safe.tags.map(t => String(t).slice(0, 40)).slice(0, 8);
  } else {
    safe.tags = [];
  }

  if (safe.publication_date) {
    const d = new Date(safe.publication_date);
    safe.publication_date = !isNaN(d.getTime())
      ? d.toISOString().split("T")[0]
      : null;
  } else {
    safe.publication_date = null;
  }

  if (!safe.publication_date) {
    throw new Error("DATA DE PUBLICAÇÃO NÃO ENCONTRADA - Notícia rejeitada");
  }

  safe.source_name = safe.source_name ? String(safe.source_name).slice(0, 120) : undefined;
  safe.external_url = safe.external_url ? String(safe.external_url).slice(0, 500) : undefined;
  safe.category = safe.category || "contabil";
  safe.importance = safe.importance || "media";
  safe.is_highlighted = !!safe.is_highlighted;

  return safe;
}

export async function safeCreateNews(newsData) {
  const payload = normalizeNewsPayload(newsData);
  console.log("   [safeCreateNews] Notícia normalizada para criação:", payload);
  console.log("   [safeCreateNews] Tentando criar notícia:", { title: payload.title.substring(0, Math.min(payload.title.length, 50)), source: payload.source_name });

  try {
    const created = await News.create(payload);
    console.log("   [safeCreateNews] ✅ Notícia criada com sucesso no BD, ID:", created.id);
    return created;
  } catch (error) {
    console.error("   [safeCreateNews] ❌ Erro ao tentar criar notícia no BD:", error);
    console.error("   [safeCreateNews] Payload que falhou:", payload);
    throw error;
  }
}

function ensureString(v, fallback = "") {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  try {
    return String(v);
  } catch {
    return fallback;
  }
}
function cap(str, n) {
  const s = ensureString(str, "");
  return s.length > n ? s.slice(0, n) : s;
}
function sanitizeImportance(v) {
  const allowed = ["alta", "media", "baixa"];
  const s = ensureString(v, "media").toLowerCase();
  return allowed.includes(s) ? s : "media";
}
function ensureArrayOfStrings(arr, maxItems = 8, itemLen = 40) {
  if (!Array.isArray(arr)) return [];
  return arr.map((t) => cap(t, itemLen)).slice(0, maxItems);
}

export async function generateNewsViaLLM({ sourceName, sourceDescription, topic, defaultCategory, sourceWebsite }) {
  if (!isLLMAvailable()) {
    throw new Error("LLM indisponível temporariamente - aguarde 5 minutos");
  }

  console.log(`   🔍 Iniciando busca de notícia real sobre: ${topic}`);
  
  let dateResponse;
  let searchMethod;

  // ===== ESTRATÉGIA 1: Se tem website, buscar direto no site =====
  if (sourceWebsite && sourceWebsite.trim() !== '') {
    console.log(`   🌐 Tentando buscar no site: ${sourceWebsite}`);
    searchMethod = 'website';
    
    const dateExtractionPrompt = `
Acesse o site: ${sourceWebsite}

TAREFA CRÍTICA:
1. Encontre a notícia MAIS RECENTE que seja ESPECIFICAMENTE sobre: ${topic}
2. A notícia DEVE ter sido publicada nos ÚLTIMOS 3 DIAS
3. A notícia DEVE SER DIRETAMENTE sobre o tópico (NÃO aceite notícias tangenciais ou genéricas)
4. Extraia a DATA EXATA de publicação
5. Extraia a URL COMPLETA E ESPECÍFICA da notícia
6. Identifique o IDIOMA da notícia (inglês ou português)

VALIDAÇÃO DE RELEVÂNCIA:
- Se a notícia NÃO for DIRETAMENTE sobre "${topic}", retorne found: false
- Se for sobre outro assunto (mesmo que relacionado), retorne found: false
- Exemplo: Se buscar "reforma tributária" e encontrar "ICMS genérico", rejeite (found: false)
- Exemplo: Se buscar "eSocial" e encontrar "CLT genérica", rejeite (found: false)

INSTRUÇÕES TÉCNICAS:
- Procure por: meta tags (article:published_time), JSON-LD (datePublished), tags <time>
- Data no formato YYYY-MM-DD
- URL específica da notícia (não homepage)
- **REGRA: SEM DATA = SEM NOTÍCIA (found: false)**
- **REGRA: NOTÍCIA FORA DO TÓPICO = REJEITAR (found: false)**

Responda em JSON.
`;

    try {
      dateResponse = await invokeLLMWithRetry({
        prompt: dateExtractionPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            found: { type: "boolean" },
            publication_date: { type: "string" },
            news_url: { type: "string" },
            news_title: { type: "string" },
            news_language: { type: "string", enum: ["pt", "en", "other"] },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            relevance_check: { 
              type: "string", 
              description: "Breve explicação de por que a notícia É ou NÃO É relevante para o tópico" 
            }
          }
        }
      });
    } catch (error) {
      console.log(`   ⚠️ Falha ao acessar website, tentando busca web...`);
      dateResponse = null;
    }
  }

  // ===== ESTRATÉGIA 2: Se não tem website OU falhou, fazer busca web genérica =====
  if (!dateResponse || !dateResponse.found || !dateResponse.publication_date) {
    console.log(`   🔎 Fazendo busca web genérica...`);
    searchMethod = 'web_search';
    
    const webSearchPrompt = `
Faça uma busca na web por notícias ESPECÍFICAS sobre:
- Tópico EXATO: ${topic}
- Fonte sugerida: ${sourceName}
- Categoria: ${defaultCategory}

CRITÉRIOS OBRIGATÓRIOS:
1. A notícia DEVE ser ESPECIFICAMENTE sobre "${topic}"
2. Publicada nos ÚLTIMOS 3 DIAS
3. Fonte confiável (governo, portais grandes)
4. Data extraída com ALTA confiança
5. URL ESPECÍFICA da notícia

VALIDAÇÃO RIGOROSA DE RELEVÂNCIA:
- Se a notícia NÃO for DIRETAMENTE sobre "${topic}", NÃO RETORNE
- Rejeite notícias tangenciais ou genéricas
- Exemplo: Se buscar "IFRS" e encontrar "CPC genérico", rejeite
- Exemplo: Se buscar "reforma tributária" e encontrar "PIS/COFINS normal", rejeite

IDIOMA:
- Identifique se a notícia está em português (pt) ou inglês (en)

**REGRA CRÍTICA: SE NÃO ENCONTRAR NOTÍCIA QUE ATENDA TODOS OS CRITÉRIOS, retorne found: false**

Responda em JSON.
`;

    try {
      dateResponse = await invokeLLMWithRetry({
        prompt: webSearchPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            found: { type: "boolean" },
            publication_date: { type: "string" },
            news_url: { type: "string" },
            news_title: { type: "string" },
            news_language: { type: "string", enum: ["pt", "en", "other"] },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            source_found: { type: "string" },
            relevance_check: { 
              type: "string", 
              description: "Por que essa notícia é relevante para o tópico específico" 
            }
          }
        }
      });
    } catch (error) {
      console.error(`   ❌ Erro na busca web:`, error.message);
      throw new Error(`Notícia rejeitada: Falha ao buscar notícias na web - ${error.message}`);
    }
  }

  // ===== VALIDAÇÃO 1: Notícia encontrada? =====
  if (!dateResponse || !dateResponse.found) {
    console.log(`   ❌ REJEITADA: Não encontrou notícia recente sobre o tópico específico`);
    throw new Error(`Notícia rejeitada: Nenhuma notícia dos últimos 3 dias encontrada sobre ${topic} de ${sourceName}`);
  }

  // ===== VALIDAÇÃO 2: Data de publicação OBRIGATÓRIA =====
  if (!dateResponse.publication_date || dateResponse.publication_date.trim() === '') {
    console.log(`   ❌ REJEITADA: Data de publicação não encontrada`);
    throw new Error(`Notícia rejeitada: Data de publicação não encontrada`);
  }

  // ===== VALIDAÇÃO 3: Confiança alta ou média? =====
  if (dateResponse.confidence === "low") {
    console.log(`   ❌ REJEITADA: Confiança baixa na data extraída`);
    throw new Error("Notícia rejeitada: Confiança baixa na data extraída");
  }

  // ===== VALIDAÇÃO 4: Data nos últimos 3 dias? =====
  const pubDate = new Date(dateResponse.publication_date);
  
  if (isNaN(pubDate.getTime())) {
    console.log(`   ❌ REJEITADA: Data inválida: ${dateResponse.publication_date}`);
    throw new Error(`Notícia rejeitada: Data de publicação inválida - ${dateResponse.publication_date}`);
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);
  
  if (pubDate < threeDaysAgo || pubDate > today) {
    const diffDays = Math.floor((today - pubDate) / (1000 * 60 * 60 * 24));
    console.log(`   ❌ REJEITADA: Notícia fora do período permitido (${diffDays} dias atrás)`);
    throw new Error(`Notícia rejeitada: Data ${dateResponse.publication_date} está fora do período dos últimos 3 dias`);
  }

  // ===== VALIDAÇÃO 5: URL específica da notícia? =====
  const newsUrl = dateResponse.news_url || '';
  if (!newsUrl || newsUrl.trim() === '') {
    console.log(`   ❌ REJEITADA: URL da notícia não fornecida`);
    throw new Error("Notícia rejeitada: URL específica da notícia não encontrada");
  }

  const isGenericUrl = (
    newsUrl === sourceWebsite ||
    newsUrl.endsWith('/') ||
    newsUrl.match(/\/(noticias|news|artigos|blog)\/?$/i)
  );

  if (isGenericUrl) {
    console.log(`   ❌ REJEITADA: URL genérica fornecida: ${newsUrl}`);
    throw new Error("Notícia rejeitada: URL fornecida é genérica, não específica da notícia");
  }

  const realPublicationDate = dateResponse.publication_date;
  const newsTitle = dateResponse.news_title || '';
  const newsLanguage = dateResponse.news_language || 'pt';
  const isEnglish = newsLanguage === 'en';

  const diffDays = Math.floor((today - pubDate) / (1000 * 60 * 60 * 24));
  console.log(`   ✅ Notícia válida encontrada via ${searchMethod}!`);
  console.log(`   📅 Data: ${realPublicationDate} (${diffDays} dia(s) atrás)`);
  console.log(`   🔗 URL específica: ${newsUrl}`);
  console.log(`   📰 Título: ${newsTitle.substring(0, 60)}...`);
  console.log(`   🌐 Idioma: ${newsLanguage === 'en' ? 'Inglês' : 'Português'}`);
  console.log(`   ⭐ Confiança: ${dateResponse.confidence}`);
  if (dateResponse.relevance_check) {
    console.log(`   ✔️ Relevância: ${dateResponse.relevance_check.substring(0, 100)}...`);
  }

  // ===== Gerar conteúdo adaptado da notícia COM TRADUÇÃO E CLASSIFICAÇÃO =====
  const contentPrompt = `
Você é um EDITOR ESPECIALIZADO em notícias contábeis, fiscais e tributárias brasileiras.

CONTEXTO DA NOTÍCIA:
• Título: ${newsTitle}
• Fonte: ${sourceName}
• Data: ${realPublicationDate}
• URL: ${newsUrl}
• Tópico: ${topic}
• Idioma Original: ${isEnglish ? 'INGLÊS' : 'PORTUGUÊS'}

═══════════════════════════════════════════════════════════════
PASSO 1: REESCREVER (E TRADUZIR SE NECESSÁRIO)
═══════════════════════════════════════════════════════════════
${isEnglish ? '⚠️ ATENÇÃO: Esta notícia está em INGLÊS. Você DEVE TRADUZI-LA COMPLETAMENTE para português brasileiro.' : ''}

Reescreva a notícia de forma PROFISSIONAL:
• Título (máx 120 chars): Claro e direto ${isEnglish ? '- TRADUZIDO' : ''}
• Resumo (máx 400 chars): Essência da notícia ${isEnglish ? '- TRADUZIDO' : ''}
• Conteúdo (máx 4000 chars): Detalhes práticos, impactos e ações ${isEnglish ? '- TRADUZIDO' : ''}
• Tags (3-5): Termos técnicos relevantes

${isEnglish ? '⚠️ IMPORTANTE: TODO o conteúdo deve estar em PORTUGUÊS. Adicione a tag "notícia original em inglês" automaticamente.' : ''}

═══════════════════════════════════════════════════════════════
PASSO 2: CLASSIFICAR CATEGORIA (MAIS ESPECÍFICA)
═══════════════════════════════════════════════════════════════
Opções: reforma_tributaria, ifrs, usgaap, folha_pagamento, tributaria, fiscal, contabil

REGRA: Escolha a MAIS ESPECÍFICA que se encaixe no conteúdo.

═══════════════════════════════════════════════════════════════
PASSO 3: CLASSIFICAR IMPORTÂNCIA
═══════════════════════════════════════════════════════════════
**NOVA ABORDAGEM: Primeiro JUSTIFIQUE, depois CLASSIFIQUE**

Analise a notícia e responda estas perguntas:

1. Esta notícia cria uma NOVA OBRIGAÇÃO ou altera uma existente? (Sim/Não)
2. Existe um PRAZO URGENTE (< 30 dias)? (Sim/Não)
3. O impacto é UNIVERSAL (afeta >50% das empresas)? (Sim/Não)
4. Há mudança em LEI, DECRETO ou NORMA OBRIGATÓRIA? (Sim/Não)
5. É apenas informativo/esclarecimento SEM impacto prático? (Sim/Não)

REGRA SIMPLES:
• Se respondeu SIM para questões 1, 2, 3 ou 4 → **ALTA**
• Se é apenas informativo (questão 5 = SIM) → **BAIXA**
• Caso contrário → **MÉDIA**

═══════════════════════════════════════════════════════════════
FORMATO DE RESPOSTA (JSON):
═══════════════════════════════════════════════════════════════
{
  "title": "...",
  "summary": "...",
  "content": "...",
  "category": "...",
  "importance_analysis": {
    "creates_new_obligation": true/false,
    "urgent_deadline": true/false,
    "universal_impact": true/false,
    "changes_mandatory_rule": true/false,
    "only_informative": true/false
  },
  "importance": "alta/media/baixa",
  "tags": ["tag1", "tag2"...],
  "is_highlighted": true/false
}
`;

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      content: { type: "string" },
      category: { 
        type: "string", 
        enum: ["contabil", "fiscal", "folha_pagamento", "tributaria", "reforma_tributaria", "ifrs", "usgaap"]
      },
      importance_analysis: {
        type: "object",
        properties: {
          creates_new_obligation: { type: "boolean" },
          urgent_deadline: { type: "boolean" },
          universal_impact: { type: "boolean" },
          changes_mandatory_rule: { type: "boolean" },
          only_informative: { type: "boolean" }
        }
      },
      importance: { type: "string", enum: ["alta", "media", "baixa"] },
      tags: { type: "array", items: { type: "string" } },
      is_highlighted: { type: "boolean" },
    },
    required: ["title", "summary", "content", "category", "importance_analysis", "importance", "tags", "is_highlighted"]
  };

  let res = null;

  try {
    res = await invokeLLMWithRetry({ prompt: contentPrompt, response_json_schema: schema });

    if (!res || !ensureString(res.title).trim() || !ensureString(res.summary).trim()) {
      res = {
        title: newsTitle || `${topic} - ${sourceName}`,
        summary: `Atualização recente sobre ${topic} publicada por ${sourceName} em ${realPublicationDate}.`,
        content: `Notícia encontrada em ${newsUrl}. Acesse o link para mais detalhes.`,
        category: defaultCategory || "contabil",
        importance_analysis: {
          creates_new_obligation: false,
          urgent_deadline: false,
          universal_impact: false,
          changes_mandatory_rule: false,
          only_informative: true
        },
        importance: "media",
        tags: [defaultCategory, sourceName.split(' ')[0]],
        is_highlighted: false
      };
    }
  } catch (_err) {
    markLLMDown(5);
    throw new Error("Falha ao gerar conteúdo da notícia via LLM");
  }

  const title = cap(ensureString(res.title).trim(), 120);
  const summary = cap(ensureString(res.summary).trim(), 400);
  const content = cap(ensureString(res.content).trim(), 4000);
  const category = ensureString(res.category) || defaultCategory || "contabil";
  
  // Aplicar regra simples de importância baseada na análise
  let importance = "media"; // default
  if (res.importance_analysis) {
    const analysis = res.importance_analysis;
    if (analysis.creates_new_obligation || analysis.urgent_deadline || 
        analysis.universal_impact || analysis.changes_mandatory_rule) {
      importance = "alta";
    } else if (analysis.only_informative) {
      importance = "baixa";
    }
  } else {
    importance = sanitizeImportance(res.importance);
  }
  
  let tags = ensureArrayOfStrings(res.tags);
  
  // Adicionar tag "notícia original em inglês" se for o caso
  if (isEnglish && !tags.includes("notícia original em inglês")) {
    tags.push("notícia original em inglês");
  }
  
  const is_highlighted = !!res.is_highlighted;

  console.log(`   🎯 Análise de importância:`, res.importance_analysis);
  console.log(`   🎯 Classificação de importância: ${importance.toUpperCase()}`);
  console.log(`   🗂️ Classificação de categoria: ${category}`);
  if (isEnglish) {
    console.log(`   🌐 Notícia TRADUZIDA do inglês para português`);
  }

  return {
    title,
    summary,
    content: content || summary,
    category,
    importance,
    tags,
    is_highlighted,
    source_name: ensureString(sourceName).slice(0, 120),
    publication_date: realPublicationDate,
    external_url: newsUrl,
  };
}