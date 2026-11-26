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
  setToken(null);
  window.dispatchEvent(new CustomEvent("fm:signed-out", { detail: data.error }));
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

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }

  if (!res.ok) {
    noteSignedOut(data, token);
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
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
