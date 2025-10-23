const memoryStore = new Map();

function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return {
    getItem(key) {
      return memoryStore.has(key) ? memoryStore.get(key) : null;
    },
    setItem(key, value) {
      memoryStore.set(key, value);
    },
    removeItem(key) {
      memoryStore.delete(key);
    },
  };
}

export function readCollection(key, fallback = []) {
  const storage = getStorage();
  const raw = storage.getItem(key);

  if (!raw) {
    writeCollection(key, fallback);
    return clone(fallback);
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return clone(parsed);
    }
  } catch (error) {
    console.warn(`[localStore] Falha ao ler chave ${key}:`, error);
  }

  writeCollection(key, fallback);
  return clone(fallback);
}

export function writeCollection(key, data) {
  const storage = getStorage();
  storage.setItem(key, JSON.stringify(data));
}

export function clearCollection(key) {
  const storage = getStorage();
  storage.removeItem(key);
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function generateId(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${random}${timestamp}`;
}

export function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
