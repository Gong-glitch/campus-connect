// Use a relative base so all requests flow through the Vite proxy
// (/api → http://127.0.0.1:8000) instead of hitting an external server.
// ✅ Replace the old const BASE line with this smart toggle:
const BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "/api" 
  : "https://campus-connect-3s6n.onrender.com/api"; // Your live production API domain

const TOKEN_KEY = "campus-auth-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status}).`);
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),

  async upload(file) {
    const headers = { Accept: "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const body = new FormData();
    body.append("image", file);
    const res = await fetch(`${BASE}/upload`, { method: "POST", headers, body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Upload failed (${res.status}).`);
    return data.url;
  }
};
