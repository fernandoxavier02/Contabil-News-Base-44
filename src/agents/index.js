import { clone, delay, generateId, readCollection, writeCollection } from "@/lib/localStore";

const STORAGE_KEY = "contabilNews:conversations";
const DEFAULT_CONVERSATIONS = [
  {
    id: "conv_demo",
    agent_name: "code_diagnostics_agent",
    metadata: {
      name: "Exemplo de Diagnóstico",
      createdAt: "2025-01-12T14:00:00.000Z",
    },
    created_at: "2025-01-12T14:00:00.000Z",
    updated_at: "2025-01-12T14:00:00.000Z",
    messages: [
      {
        id: "msg_demo_system",
        role: "system",
        content:
          "Você está no modo local do Contábil News. Cole logs de erro ou descreva um problema para receber sugestões.",
        created_at: "2025-01-12T14:00:00.000Z",
      },
      {
        id: "msg_demo_assistant",
        role: "assistant",
        content:
          "Olá! Compartilhe uma mensagem de erro, stack trace ou explique o comportamento que deseja analisar. Eu irei sugerir causas prováveis e passos para resolução.",
        created_at: "2025-01-12T14:00:05.000Z",
      },
    ],
  },
];

const listeners = new Map();

function loadConversations() {
  return readCollection(STORAGE_KEY, DEFAULT_CONVERSATIONS);
}

function saveConversations(convs) {
  writeCollection(STORAGE_KEY, convs);
}

function notify(conversationId) {
  const all = loadConversations();
  const conversation = all.find((conv) => conv.id === conversationId);
  if (!conversation) {
    return;
  }
  const payload = {
    conversation: clone(conversation),
    messages: clone(conversation.messages),
  };

  const subscriberSet = listeners.get(conversationId);
  if (!subscriberSet) return;

  subscriberSet.forEach((callback) => {
    try {
      callback(payload);
    } catch (error) {
      console.error("[agentSDK] Erro ao notificar assinante:", error);
    }
  });
}

function sortConversations(convs) {
  return [...convs].sort((a, b) => {
    const aTime = Date.parse(a.updated_at || a.created_at || 0);
    const bTime = Date.parse(b.updated_at || b.created_at || 0);
    return bTime - aTime;
  });
}

function ensureConversation(conversationOrId) {
  const conversations = loadConversations();
  const id = typeof conversationOrId === "string" ? conversationOrId : conversationOrId?.id;
  if (!id) {
    throw new Error("Conversação inválida");
  }
  const index = conversations.findIndex((conv) => conv.id === id);
  if (index === -1) {
    throw new Error(`Conversação não encontrada (${id})`);
  }
  return { conversations, index };
}

function generateAssistantReply(prompt) {
  const trimmed = (prompt || "").trim();

  if (!trimmed) {
    return "Não identifiquei detalhes específicos no seu relato. Poderia compartilhar o erro ou comportamento observado?";
  }

  const suggestions = [
    "Revise os logs para identificar a primeira ocorrência do erro e isole o trecho de código responsável.",
    "Confira se todas as dependências necessárias estão instaladas e com versões compatíveis.",
    "Verifique se há variáveis de ambiente ausentes ou com valores inesperados.",
    "Tente reproduzir o problema em ambiente local com configuração mínima para facilitar a análise.",
    "Adicione logs adicionais no ponto crítico para entender o fluxo de dados durante a execução.",
  ];

  const randomTip = suggestions[Math.floor(Math.random() * suggestions.length)];

  return `Analisando o trecho fornecido:\n\n${trimmed}\n\nSugestão rápida:\n- ${randomTip}\n\nSe ainda precisar de ajuda, informe o stack trace completo ou os passos para reproduzir.`;
}

async function scheduleAssistantResponse(conversationId, userMessage) {
  const { conversations, index } = ensureConversation(conversationId);
  const conversation = conversations[index];

  const assistantMessage = {
    id: generateId("msg"),
    role: "assistant",
    content: "",
    created_at: new Date().toISOString(),
    is_streaming: true,
  };

  conversation.messages.push(assistantMessage);
  conversation.updated_at = assistantMessage.created_at;
  saveConversations(conversations);
  notify(conversationId);

  await delay(600);

  const reply = generateAssistantReply(userMessage?.content);
  assistantMessage.content = reply;
  saveConversations(conversations);
  notify(conversationId);

  await delay(200);
  assistantMessage.is_streaming = false;
  saveConversations(conversations);
  notify(conversationId);
}

export const agentSDK = {
  async listConversations({ agent_name } = {}) {
    const conversations = loadConversations().filter((conv) => {
      return agent_name ? conv.agent_name === agent_name : true;
    });
    await delay(120);
    return sortConversations(conversations).map((conv) => clone(conv));
  },

  async createConversation({ agent_name, metadata = {} }) {
    const conversations = loadConversations();
    const now = new Date().toISOString();
    const conversation = {
      id: generateId("conv"),
      agent_name,
      metadata: {
        name: metadata.name || "Sessão de diagnóstico",
        createdAt: metadata.createdAt || now,
      },
      created_at: now,
      updated_at: now,
      messages: [
        {
          id: generateId("msg"),
          role: "assistant",
          content:
            "Olá! Estou pronto para ajudar. Descreva o erro, compartilhe um stack trace ou explique o comportamento inesperado que deseja analisar.",
          created_at: now,
        },
      ],
    };

    conversations.push(conversation);
    saveConversations(conversations);
    notify(conversation.id);
    await delay(80);

    return clone(conversation);
  },

  async getConversation(conversationId) {
    const conversations = loadConversations();
    const conversation = conversations.find((conv) => conv.id === conversationId);
    if (!conversation) {
      throw new Error(`Conversação não encontrada (${conversationId})`);
    }
    await delay(80);
    return clone(conversation);
  },

  async addMessage(conversationOrId, message) {
    const { conversations, index } = ensureConversation(conversationOrId);
    const conversation = conversations[index];

    const entry = {
      id: generateId("msg"),
      role: message.role || "user",
      content: message.content || "",
      created_at: new Date().toISOString(),
    };

    conversation.messages.push(entry);
    conversation.updated_at = entry.created_at;
    saveConversations(conversations);
    notify(conversation.id);

    if (entry.role === "user") {
      scheduleAssistantResponse(conversation.id, entry).catch((error) => {
        console.error("[agentSDK] Erro na resposta simulada:", error);
      });
    }

    await delay(80);
    return clone(entry);
  },

  subscribeToConversation(conversationId, callback) {
    if (!listeners.has(conversationId)) {
      listeners.set(conversationId, new Set());
    }
    const set = listeners.get(conversationId);
    set.add(callback);

    // Emitir estado inicial
    try {
      const conversations = loadConversations();
      const conversation = conversations.find((conv) => conv.id === conversationId);
      if (conversation) {
        callback({
          conversation: clone(conversation),
          messages: clone(conversation.messages),
        });
      }
    } catch (error) {
      console.error("[agentSDK] Erro ao enviar estado inicial:", error);
    }

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        listeners.delete(conversationId);
      }
    };
  },
};
