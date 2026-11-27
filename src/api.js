const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "clinigram_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// The server marks a refusal with signedOut when this sign-in is no longer good (account
// deactivated or deleted, or session expired). A wrong PIN is not marked. The token comparison
// means this fires once, and a late reply for an old sign-in can't sign out a newer one.
export function noteSignedOut(data, token) {
  if (!data?.signedOut || !token || getToken() !== token) return;
  // Changing your own PIN replaces this sign-in; a check that crosses it on the way must not end it.
  if ([...pendingWrites.keys()].some((k) => k.startsWith("PUT /api/auth/my-pin "))) return;
  setToken(null);
  window.dispatchEvent(new CustomEvent("fm:signed-out", { detail: data.error }));
}

// A read that gets no answer is given up after 30 seconds (long enough for a sleeping server) and
// tried once more. Saves are NEVER cut off or repeated: the server may already have done them.
const READ_TIMEOUT_MS = 30000;
const UNREACHABLE = "Can't reach the server. Check your connection and try again.";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readOnce(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    let data = null;
    try { data = await res.json(); } catch (e) { if (controller.signal.aborted) throw e; }
    return { res, data };
  } finally {
    clearTimeout(timer);
  }
}

async function readWithRetry(url, options) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const reply = await readOnce(url, options);
      // 502/503/504 usually mean the server is restarting or waking up.
      if (attempt > 1 || ![502, 503, 504].includes(reply.res.status)) return reply;
    } catch (e) {
      if (attempt > 1) throw new Error(UNREACHABLE);
    }
    await pause(1200);
  }
}

// An update must not reload the app while a save is on its way (see lib/safeReload.js).
export function hasPendingWrites() {
  return pendingWrites.size > 0;
}

// Safety net: if the exact same save is already on its way, don't send it a second time.
const pendingWrites = new Map();

function request(method, path, body) {
  if (method === "GET") return send(method, path, body);
  const key = `${method} ${path} ${JSON.stringify(body ?? null)}`;
  if (!pendingWrites.has(key)) {
    pendingWrites.set(key, send(method, path, body).finally(() => pendingWrites.delete(key)));
  }
  return pendingWrites.get(key);
}

async function send(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${BASE_URL}${path}`;
  const options = { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined };
  let res;
  let data = null;
  if (method === "GET") {
    ({ res, data } = await readWithRetry(url, options));
  } else {
    res = await fetch(url, options);
    try { data = await res.json(); } catch (e) { /* empty body */ }
  }

  if (!res.ok) {
    noteSignedOut(data, token);
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Asks whether this sign-in still stands. While the app is in use the server hands back a renewed
// sign-in now and then; it is kept only if nobody signed out or in while the reply was on its way.
export async function checkSignIn() {
  const sent = getToken();
  const { renewedToken, ...user } = (await request("GET", "/api/auth/me")) || {};
  if (renewedToken && sent && getToken() === sent) setToken(renewedToken);
  return user;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  del: (path) => request("DELETE", path),
};

export async function postForBlob(path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try { const data = await res.json(); noteSignedOut(data, token); message = data.error || message; } catch (e) { /* empty body */ }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.blob();
}
