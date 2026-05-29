// 🌍 Switches seamlessly between your development environment and your true Render container!
const BASE = import.meta.env.DEV
  ? "/api"
  : "https://campus-connect-api-0s3b.onrender.com/api"; // 🎯 Your live API endpoint

// 🔍 Matches your local storage session tracking key
const TOKEN_KEY = "campus-lost-found-csu-v2";

export function getToken() {
  try {
    const dataString = localStorage.getItem(TOKEN_KEY);
    if (!dataString) return null;
    const parsedData = JSON.parse(dataString);
    if (parsedData.session && parsedData.session.token) {
      return parsedData.session.token;
    }
    return parsedData.token || null;
  } catch (error) {
    console.error("Error reading token from local storage:", error);
    return null;
  }
}

export function setToken(token) {
  try {
    const dataString = localStorage.getItem(TOKEN_KEY) || "{}";
    const parsedData = JSON.parse(dataString);
    if (!parsedData.session) parsedData.session = {};
    if (token) {
      parsedData.session.token = token;
      parsedData.token = token;
      localStorage.setItem(TOKEN_KEY, JSON.stringify(parsedData));
    } else {
      if (parsedData.session) delete parsedData.session.token;
      delete parsedData.token;
      localStorage.setItem(TOKEN_KEY, JSON.stringify(parsedData));
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