// 🌍 Switches seamlessly between your development environment and your true Render container!
const BASE = import.meta.env.DEV
  ? "/api"
  : "https://campus-connect-api-0s3b.onrender.com/api"; // 🎯 Your live API endpoint

// 🔍 ISOLATED KEY: Saves your token safely away from the store state persistence
const REAL_TOKEN_KEY = "campus-connect-auth-token";

export function getToken() {
  try {
    return localStorage.getItem(REAL_TOKEN_KEY) || null;
  } catch (error) {
    console.error("Error reading token from local storage:", error);
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(REAL_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REAL_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error setting token in local storage:", error);
  }
}

async function request(method, path, body) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${BASE}${cleanPath}`;

  const res = await fetch(targetUrl, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const responseText = await res.text().catch(() => "");

  let data = {};
  if (responseText.trim()) {
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Server returned non-JSON text:", responseText);
      throw new Error("Target API route misconfigured or returned HTML.");
    }
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status (${res.status}).`);
  }

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

    const res = await fetch(`${BASE}/upload`, {
      method: "POST",
      headers,
      body,
    });

    const responseText = await res.text().catch(() => "");
    let data = {};
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (e) {}
    }

    if (!res.ok) {
      throw new Error(data.message || `Upload failed (${res.status}).`);
    }
    return data.url;
  },
};