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
  const base = saved ? { ...initialData, ...saved } : { ...initialData };
  if (base.session && !getToken()) base.session = null;
  if (!raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return base;
}

// Maps a raw API item (found item / found report) to the shape used by the UI
function mapItem(raw) {
  return {
    id: raw.id,
    name: raw.title ?? raw.name ?? "",
    category: raw.category ?? "",
    location: raw.location ?? "",
    status: raw.status ?? "Unclaimed",
    description: raw.description ?? "",
    photo: raw.image_path || `https://placehold.co/640x420/e8f5ee/1b6b3a?text=${encodeURIComponent(raw.title ?? raw.name ?? "Item")}`,
    reportedBy: raw.user?.name ?? "Admin",
    date: (raw.found_date ?? raw.created_at ?? raw.date ?? "").slice(0, 10),
    contactEmail: raw.contact_email ?? ""
  };
}

// Maps a raw API lost_report to the shape used by MyReports / AdminLostReports
function mapLostReport(raw) {
  return {
    id: raw.id,
    name: raw.title ?? "",
    category: raw.category ?? "",
    location: raw.location ?? "",
    date: raw.date_lost ?? (raw.created_at ?? "").slice(0, 10),
    description: raw.description ?? "",
    photo: raw.image_path || "",
    status: raw.status ?? "Open",
    contactEmail: raw.contact_email ?? "",
    reportedBy: raw.user?.name ?? ""
  };
}

// Maps a raw API item that is a student-submitted found report (pending/rejected/approved)
function mapFoundReport(raw) {
  return {
    id: raw.id,
    name: raw.title ?? "",
    category: raw.category ?? "",
    location: raw.location ?? "",
    date: raw.found_date ?? (raw.created_at ?? "").slice(0, 10),
    description: raw.description ?? "",
    photo: raw.image_path || "",
    status: raw.status ?? "Pending Approval",
    contactEmail: raw.contact_email ?? "",
    reportedBy: raw.user?.name ?? ""
  };
}

export function createAppStore() {
  const state = reactive({
    ...loadState(),
    foundItems: [],
    lostReports: [],
    foundReports: []
  });

  function persist() {
    // foundItems, lostReports, foundReports are all API-backed — never persist to localStorage
    const { foundItems: _fi, lostReports: _lr, foundReports: _fr, ...toSave } = JSON.parse(JSON.stringify(state));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  function addActivity(text) {
    state.activity.unshift({ id: crypto.randomUUID(), text, time: new Date().toLocaleString() });
    persist();
  }

  const store = {
    state,
    persist,

    // Fetch publicly visible found items (excludes pending/rejected student submissions)
    async fetchItems() {
      try {
        const raw = await api.get("/items");
        state.foundItems = raw
          .filter(i => !["Pending Approval", "Rejected"].includes(i.status))
          .map(mapItem);
      } catch (_) {
        // Leave foundItems as-is on error
      }
    },

    async fetchItem(id) {
      const raw = await api.get(`/items/${id}`);
      return mapItem(raw);
    },

    // Fetch the current user's own lost reports and submitted found reports
    async fetchMyReports() {
      try {
        const [lostRaw, foundRaw] = await Promise.all([
          api.get("/my-reports/lost"),
          api.get("/items?mine=1")
        ]);
        state.lostReports = lostRaw.map(mapLostReport);
        state.foundReports = foundRaw.map(mapFoundReport);
      } catch (_) {
        // Leave arrays as-is on error
      }
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
      state.lostReports = [];
      state.foundReports = [];
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

    // Student submits a lost item report — persisted to the DB, returns numeric reference ID
    async addLostReport(payload) {
      const clean = sanitizeReportPayload(payload);
      if (!clean.name || !clean.description || !clean.date || !isValidEmail(clean.contactEmail)) {
        throw new Error("Invalid lost report input.");
      }
      const data = await api.post("/lost-reports", {
        title:         clean.name,
        description:   clean.description,
        category:      clean.category,
        location:      clean.location,
        date_lost:     clean.date,
        contact_email: clean.contactEmail,
        image_path:    clean.photo || null
      });
      addActivity(`${clean.name} lost report submitted`);
      await store.fetchMyReports();
      return data.report.id;
    },

    // Student submits a found item report — stored as a pending item in the DB
    async addFoundReport(payload) {
      const clean = sanitizeReportPayload(payload);
      if (!clean.name || !clean.description || !clean.date || !isValidEmail(clean.contactEmail)) {
        throw new Error("Invalid found report input.");
      }
      const data = await api.post("/items", {
        title:         clean.name,
        description:   clean.description,
        category:      clean.category,
        location:      clean.location,
        found_date:    clean.date,
        contact_email: clean.contactEmail,
        status:        "Pending Approval",
        image_path:    clean.photo || null
      });
      addActivity(`${clean.name} found report submitted for approval`);
      await store.fetchMyReports();
      return data.item.id;
    },

    // Update a student's own report in the DB
    async updateReport(type, id, payload) {
      const body = {};
      if (payload.name        !== undefined) body.title       = payload.name;
      if (payload.description !== undefined) body.description = payload.description;
      if (payload.status      !== undefined) body.status      = payload.status;
      if (payload.date        !== undefined) {
        body[type === "lost" ? "date_lost" : "found_date"] = payload.date;
      }

      const endpoint = type === "lost" ? `/lost-reports/${id}` : `/items/${id}`;
      await api.patch(endpoint, body);
      await store.fetchMyReports();
    },

    // Delete a student's own report from the DB
    async deleteReport(type, id) {
      const endpoint = type === "lost" ? `/lost-reports/${id}` : `/items/${id}`;
      await api.delete(endpoint);
      await store.fetchMyReports();
    },

    submitClaim(payload) {
      const clean = sanitizeClaimPayload(payload);
      if (!clean.claimantName || !isValidSchoolId(clean.schoolId) || !isValidEmail(clean.contactEmail) || clean.proof.length < 10) {
        throw new Error("Invalid claim input.");
      }
      state.claims.unshift({ id: crypto.randomUUID(), ...clean, date: new Date().toISOString().slice(0, 10), status: "Pending", note: "" });
      addActivity(`${clean.claimantName} submitted a claim for ${clean.itemName}`);
    },

    // Admin: approve a pending found report by publishing it (PATCH status → Unclaimed)
    async approveFoundReport(id) {
      await api.patch(`/items/${id}`, { status: "Unclaimed" });
      addActivity("Found report approved and published");
      persist();
      await store.fetchItems();
    },

    // Admin: reject a pending found report
    async rejectFoundReport(id) {
      await api.patch(`/items/${id}`, { status: "Rejected" });
      addActivity("Found report rejected");
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
