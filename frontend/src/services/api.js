// 🔍 Match the exact key found in your Local Storage screenshot
const TOKEN_KEY = "campus-lost-found-csu-v2";

export function getToken() {
  try {
    const dataString = localStorage.getItem(TOKEN_KEY);
    if (!dataString) return null;

    const parsedData = JSON.parse(dataString);

    // Extends support whether the token is nested under 'session.token' or 'token' directly
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