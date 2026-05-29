// 🌍 Automatically switches environments depending on where the app is running:
// Local Dev (Replit): uses "/api" (Vite proxy handles it)
// Production (Render): uses your absolute live URL
const BASE = import.meta.env.DEV
  ? "/api"
  : "https://campus-connect-3s6n.onrender.com/api";

// 🔍 Matches your exact key found in your Local Storage
const TOKEN_KEY = "campus-lost-found-csu-v2";

export function getToken() {
  try {
    const dataString = localStorage.getItem(TOKEN_KEY);
    if (!dataString) return null;

    const parsedData = JSON.parse(dataString);

    // Safely checks if the token is nested under 'session.token' or 'token' directly
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
      parsedData.token = token; // Backup placement
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.message || `Request failed (${res.status}).`);
  return data;
}

// ✅ Explicitly exported so 'src/store/appStore.js' can import it perfectly!
export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),

  async upload(file) {
    const headers = {
      Accept: "application/json",
    };

    // 🔑 Inject the auth token parsed from your local storage session object
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const body = new FormData();
    body.append("image", file); // Matches your backend Laravel expectation ($request->file('image'))

    const res = await fetch(`${BASE}/upload`, {
      method: "POST",
      headers,
      body,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Upload failed (${res.status}).`);
    }
    return data.url; // Returns the permanent cloud/backend url link
  },
};
