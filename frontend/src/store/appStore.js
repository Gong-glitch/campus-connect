import { reactive } from "vue";
import {
  isValidEmail,
  isValidSchoolId,
  isStrongPassword,
  sanitizeClaimPayload,
  sanitizeEmail,
  sanitizeRegisterPayload,
  sanitizeReportPayload,
  sanitizeText
} from "../utils/inputProtection";
import { api, getToken, setToken } from "../services/api";

const STORAGE_KEY = "campus-lost-found-csu-v2";

const categories = ["Electronics", "Keys", "ID", "Clothing", "Bag", "Others"];
const locations = ["Main Campus Gate", "CCIS Building", "Library", "Gymnasium", "Cafeteria", "Registrar", "Student Center"];

const initialData = {
  session: null,
  users: [],
  lostReports: [],
  foundReports: [],
  claims: [],
  settings: {
    categories,
    locations,
    officeHours: "Monday to Friday, 8:00 AM - 5:00 PM",
    contactInfo: "Student Affairs Office / lostfound@carsu.edu.ph",
    announcementEnabled: true,
    announcementText: "Claim found items at the student affairs office with a valid ID."
  },
  activity: []
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const saved = raw ? JSON.parse(raw) : null;
  // foundItems is intentionally excluded from persistence — always fetched live from the API
  const base = saved ? { ...initialData, ...saved } : { ...initialData };
  if (base.session && !getToken()) base.session = null;
  // Strip any stale foundItems that may have been saved by an older version
  delete base.foundItems;
  if (!raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return base;
}

function mapItem(raw) {
  return {
    // Keep the ID as the numeric value the DB assigned — never convert to a
    // prefixed string so API calls like PUT /items/1 always receive a valid bigint
    id: raw.id,
    name: raw.title ?? raw.name ?? "",
    category: raw.category ?? "",
    location: raw.location ?? "",
    status: raw.status ?? "Unclaimed",
    description: raw.description ?? "",
    photo: raw.image_path || `https://placehold.co/640x420/e8f5ee/1b6b3a?text=${encodeURIComponent(raw.title ?? raw.name ?? "Item")}`,
    reportedBy: raw.user?.name ?? "Admin",
    date: (raw.created_at ?? raw.date ?? "").slice(0, 10),
    contactEmail: raw.contactEmail ?? ""
  };
}

export function createAppStore() {
  const state = reactive({ ...loadState(), foundItems: [] });
  state.foundReports = state.foundReports.map((report) =>
    report.status === "Pending" ? { ...report, status: "Pending Approval" } : report
  );

  function persist() {
    // Explicitly exclude foundItems — it must always be fetched fresh from the API
    const { foundItems: _ignored, ...toSave } = JSON.parse(JSON.stringify(state));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  function addActivity(text) {
    state.activity.unshift({ id: crypto.randomUUID(), text, time: new Date().toLocaleString() });
    persist();
  }

  const store = {
    state,
    persist,

    async fetchItems() {
      try {
        const raw = await api.get("/items");
        state.foundItems = raw.map(mapItem);
      } catch (_) {
        // Leave foundItems as-is on error (empty on first load, stale on retry)
      }
    },

    async fetchItem(id) {
      const raw = await api.get(`/items/${id}`);
      return mapItem(raw);
    },

    async login(email, password, role = "user") {
      const data = await api.post("/login", {
        email: sanitizeEmail(email),
        password: String(password ?? ""),
        role
      });
      setToken(data.token);
      state.session = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        schoolId: data.user.school_id,
        role: data.user.role
      };
      persist();
    },

    async register(payload) {
      const clean = sanitizeRegisterPayload(payload);
      if (!clean.name || !isValidSchoolId(clean.schoolId) || !isValidEmail(clean.email) || !isStrongPassword(payload.password)) {
        throw new Error("School ID must be in format 211-00087. Password must be 8+ chars with uppercase, lowercase, and number.");
      }
      const data = await api.post("/register", {
        name: clean.name,
        school_id: clean.schoolId,
        email: clean.email,
        password: payload.password
      });
      setToken(data.token);
      state.session = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        schoolId: data.user.school_id,
        role: data.user.role
      };
      addActivity(`${data.user.name} registered`);
      persist();
    },

    async createAdmin(payload) {
      await api.post("/setup-admin", {
        name: sanitizeText(payload.name, 120),
        school_id: sanitizeText(payload.schoolId, 40),
        email: sanitizeEmail(payload.email),
        password: payload.password
      });
      addActivity("Admin account created");
      persist();
    },

    async logout() {
      try { await api.post("/logout"); } catch (_) {}
      setToken(null);
      state.session = null;
      state.foundItems = [];
      persist();
    },

    async changeAdminPassword(currentPassword, newPassword) {
      if (!isStrongPassword(String(newPassword ?? ""))) {
        throw new Error("New password must be at least 8 characters with uppercase, lowercase, and a number.");
      }
      await api.put("/password", {
        current_password: String(currentPassword ?? ""),
        new_password: String(newPassword ?? "")
      });
      addActivity("Admin password changed");
      persist();
    },

    addLostReport(payload) {
      const clean = sanitizeReportPayload(payload);
      if (!clean.name || !clean.description || !clean.date || !isValidEmail(clean.contactEmail)) {
        throw new Error("Invalid lost report input.");
      }
      // The LOST-... ID is a client-side reference number only — it is stored in
      // localStorage and displayed to the student but is never sent to the backend.
      const report = { id: `LOST-${Date.now()}`, ...clean, status: "Open", ownerEmail: state.session?.email };
      state.lostReports.unshift(report);
      addActivity(`${clean.name} lost report submitted`);
      return report.id;
    },

    addFoundReport(payload) {
      const clean = sanitizeReportPayload(payload);
      if (!clean.name || !clean.description || !clean.date || !isValidEmail(clean.contactEmail)) {
        throw new Error("Invalid found report input.");
      }
      // The FOUND-... ID is a client-side reference number only — it is stored in
      // localStorage and displayed to the student but is never sent to the backend.
      const report = { id: `FOUND-${Date.now()}`, ...clean, status: "Pending Approval", ownerEmail: state.session?.email };
      state.foundReports.unshift(report);
      addActivity(`${clean.name} found report submitted for approval`);
      return report.id;
    },

    updateReport(type, id, payload) {
      const list = type === "lost" ? state.lostReports : state.foundReports;
      const index = list.findIndex((item) => item.id === id);
      if (index >= 0) {
        if (type === "lost") {
          const clean = sanitizeReportPayload({ ...list[index], ...payload });
          list[index] = { ...list[index], ...clean, status: payload.status || list[index].status };
        } else {
          const clean = sanitizeReportPayload({ ...list[index], ...payload });
          list[index] = { ...list[index], ...clean, status: "Pending Approval" };
        }
      }
      persist();
    },

    deleteReport(type, id) {
      const key = type === "lost" ? "lostReports" : "foundReports";
      state[key] = state[key].filter((item) => item.id !== id);
      persist();
    },

    submitClaim(payload) {
      const clean = sanitizeClaimPayload(payload);
      if (!clean.claimantName || !isValidSchoolId(clean.schoolId) || !isValidEmail(clean.contactEmail) || clean.proof.length < 10) {
        throw new Error("Invalid claim input.");
      }
      state.claims.unshift({ id: crypto.randomUUID(), ...clean, date: new Date().toISOString().slice(0, 10), status: "Pending", note: "" });
      addActivity(`${clean.claimantName} submitted a claim for ${clean.itemName}`);
    },

    // Approves a locally-submitted found report by persisting it to the database.
    // The item receives a real numeric DB ID and is re-fetched via fetchItems() so
    // every subsequent API call (edit, delete, mark-claimed) uses that numeric ID.
    async approveFoundReport(id) {
      const report = state.foundReports.find((item) => item.id === id);
      if (!report) return;

      const payload = {
        title:       report.name,
        description: report.description || "",
        category:    report.category,
        location:    report.location,
        status:      "Unclaimed",
        image_path:  report.photo || null
      };

      // POST to backend — the DB assigns a real numeric ID
      await api.post("/items", payload);

      report.status = "Approved";
      addActivity(`${report.name} approved and posted`);
      persist();

      // Re-sync foundItems from the DB so the new item carries its real numeric ID
      await store.fetchItems();
    },

    rejectFoundReport(id) {
      const report = state.foundReports.find((item) => item.id === id);
      if (!report) return;
      report.status = "Rejected";
      addActivity(`${report.name} report rejected`);
      persist();
    },

    updateClaim(id, status, note = "") {
      const claim = state.claims.find((item) => item.id === id);
      if (!claim) return;
      claim.status = status;
      claim.note = note;
      if (status === "Approved") {
        const found = state.foundItems.find((item) => item.id === claim.itemId);
        if (found) found.status = "Claimed";
      }
      addActivity(`${claim.itemName} claim ${status.toLowerCase()}`);
    },

    updateUser(id, payload) {
      const index = state.users.findIndex((item) => item.id === id);
      if (index >= 0) {
        const next = { ...state.users[index], ...payload };
        next.name = sanitizeText(next.name, 120);
        next.schoolId = sanitizeText(next.schoolId, 40);
        next.email = sanitizeEmail(next.email);
        state.users[index] = next;
      }
      persist();
    },

    deleteUser(id) {
      state.users = state.users.filter((item) => item.id !== id);
      persist();
    },

    saveSettings(settings) {
      state.settings = { ...state.settings, ...settings };
      addActivity("Settings updated");
    }
  };

  return store;
}

export const appStoreKey = Symbol("campus-lost-found-store");
