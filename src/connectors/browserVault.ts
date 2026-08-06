"use client";

export type ConnectorSettings = {
  endpoint: string;
  apiKey: string;
  model: string;
  tavilyApiKey: string;
  mcpEndpoint: string;
  mcpApiKey: string;
};

export type WebEvidence = {
  title: string;
  url: string;
  content: string;
};

type EncryptedSettings = {
  id: "primary";
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
  savedAt: string;
};

const DB_NAME = "gridlens-secure-v1";
const DB_VERSION = 1;
const KEY_STORE = "keyring";
const SETTINGS_STORE = "connector-settings";
const KEY_ID = "device-key";
const AAD = new TextEncoder().encode("gridlens-nz-connector-settings-v1");

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE);
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local vault unavailable"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local vault operation failed"));
  });
}

async function getDeviceKey(db: IDBDatabase): Promise<CryptoKey> {
  const read = db.transaction(KEY_STORE, "readonly").objectStore(KEY_STORE).get(KEY_ID);
  const existing = await requestResult<CryptoKey | undefined>(read);
  if (existing) return existing;

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const write = db.transaction(KEY_STORE, "readwrite").objectStore(KEY_STORE).put(key, KEY_ID);
  await requestResult(write);
  return key;
}

export async function saveConnectorSettings(settings: ConnectorSettings): Promise<void> {
  const db = await openDatabase();
  try {
    const key = await getDeviceKey(db);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(settings));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: AAD },
      key,
      plaintext,
    );
    const record: EncryptedSettings = {
      id: "primary",
      iv: iv.buffer,
      ciphertext,
      savedAt: new Date().toISOString(),
    };
    const write = db
      .transaction(SETTINGS_STORE, "readwrite")
      .objectStore(SETTINGS_STORE)
      .put(record);
    await requestResult(write);
  } finally {
    db.close();
  }
}

export async function loadConnectorSettings(): Promise<ConnectorSettings | null> {
  const db = await openDatabase();
  try {
    const keyRead = db.transaction(KEY_STORE, "readonly").objectStore(KEY_STORE).get(KEY_ID);
    const key = await requestResult<CryptoKey | undefined>(keyRead);
    const settingsRead = db
      .transaction(SETTINGS_STORE, "readonly")
      .objectStore(SETTINGS_STORE)
      .get("primary");
    const record = await requestResult<EncryptedSettings | undefined>(settingsRead);
    if (!key || !record) return null;
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(record.iv), additionalData: AAD },
      key,
      record.ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as ConnectorSettings;
  } catch {
    return null;
  } finally {
    db.close();
  }
}

export async function clearConnectorSettings(): Promise<void> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction([SETTINGS_STORE, KEY_STORE], "readwrite");
    transaction.objectStore(SETTINGS_STORE).clear();
    transaction.objectStore(KEY_STORE).clear();
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Clear failed"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Clear aborted"));
    });
  } finally {
    db.close();
  }
}

function normalizedBase(endpoint: string): string {
  return endpoint.trim().replace(/\/+$/, "");
}

function modelsUrl(endpoint: string): string {
  const base = normalizedBase(endpoint);
  if (/\/chat\/completions$/i.test(base)) return base.replace(/\/chat\/completions$/i, "/models");
  if (/\/responses$/i.test(base)) return base.replace(/\/responses$/i, "/models");
  if (/\/v1$/i.test(base)) return `${base}/models`;
  return `${base}/v1/models`;
}

function chatUrl(endpoint: string): string {
  const base = normalizedBase(endpoint);
  if (/\/chat\/completions$/i.test(base)) return base;
  if (/\/v1$/i.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
}

function authorizationHeaders(apiKey: string): HeadersInit {
  return apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {};
}

function publicAssistantText(value: string | undefined): string {
  return (value ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export async function testOpenAiConnection(settings: ConnectorSettings): Promise<string[]> {
  const response = await fetch(modelsUrl(settings.endpoint), {
    method: "GET",
    headers: { Accept: "application/json", ...authorizationHeaders(settings.apiKey) },
    mode: "cors",
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Endpoint returned ${response.status}`);
  const payload = (await response.json()) as { data?: Array<{ id?: string }> };
  return (payload.data ?? []).map((entry) => entry.id ?? "").filter(Boolean).slice(0, 20);
}

export async function searchTavily(
  apiKey: string,
  query: string,
): Promise<WebEvidence[]> {
  if (!apiKey.trim()) return [];
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      topic: "general",
      max_results: 4,
      include_domains: [
        "transpower.co.nz",
        "ea.govt.nz",
        "emi.ea.govt.nz",
        "lawa.org.nz",
        "mbie.govt.nz",
        "data.govt.nz",
        "stats.govt.nz",
      ],
      include_answer: false,
      include_raw_content: false,
    }),
    mode: "cors",
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Web index returned ${response.status}`);
  const payload = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };
  return (payload.results ?? [])
    .filter((entry) => entry.title && entry.url)
    .slice(0, 4)
    .map((entry) => ({
      title: entry.title ?? "Web evidence",
      url: entry.url ?? "",
      content: (entry.content ?? "").slice(0, 900),
    }));
}

export async function runOpenAiPrompt(
  settings: ConnectorSettings,
  prompt: string,
  context: string,
): Promise<string> {
  const request = async (disableReasoning = false) =>
    fetch(chatUrl(settings.endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authorizationHeaders(settings.apiKey),
      },
      body: JSON.stringify({
      model: settings.model,
      temperature: 0.2,
      max_tokens: 700,
      ...(disableReasoning
        ? {
            reasoning_format: "none",
            chat_template_kwargs: { enable_thinking: false },
          }
        : {}),
      messages: [
        {
          role: "system",
          content:
            "You are the GridLens NZ research assistant. Explain deterministic results without changing them. State uncertainty and never invent evidence.",
        },
        { role: "user", content: `${prompt}\n\nTrusted scenario context:\n${context}` },
      ],
      }),
      mode: "cors",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });

  let response = await request();
  if (!response.ok) throw new Error(`AI endpoint returned ${response.status}`);
  let payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  };
  let content = publicAssistantText(payload.choices?.[0]?.message?.content);

  // Some llama-server reasoning models can spend the entire budget in a
  // private reasoning channel and return an empty public answer. Retry once
  // with llama.cpp-compatible controls; never expose private reasoning text.
  if (!content && payload.choices?.[0]?.message?.reasoning_content) {
    response = await request(true);
    if (!response.ok) throw new Error(`AI endpoint returned ${response.status}`);
    payload = (await response.json()) as typeof payload;
    content = publicAssistantText(payload.choices?.[0]?.message?.content);
  }
  if (!content) throw new Error("AI endpoint returned no message");
  return content;
}
