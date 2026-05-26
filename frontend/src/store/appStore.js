import { reactive } from "vue";
import {
  isValidEmail,
  isValidSchoolId,
  isStrongPassword,
  sanitizeClaimPayload,
  sanitizeEmail,
  sanitizeRegisterPayload,
  sanitizeReportPayload,
  sanitizeText,
} from "../utils/inputProtection";
import { api, getToken, setToken } from "../services/api";

const STORAGE_KEY = "campus-lost-found-csu-v2";

const categories = ["Electronics", "Keys", "ID", "Clothing", "Bag", "Others"];
const defaultLocations = [
  "Main Campus Gate",
  "CCIS Building",
  "Library",
  "Gymnasium",
  "Cafeteria",
  "Registrar",
  "Student Center",
];

const initialData = {
  session: null,
  users: [],
  claims: [],
  settings: {
    categories,
    locations: defaultLocations, // Fallback defaults
    officeHours: "Monday to Friday, 8:00 AM - 5:00 PM",
    contactInfo: "Student Affairs Office / lostfound@carsu.edu.ph",
    announcementEnabled: true,
    announcementText:
      "Claim found items at the student affairs office with a valid ID.",
  },
  activity: [],
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const saved = raw ? JSON.parse(raw) : null;
  const base = saved ? { ...initialData, ...saved } : { ...initialData };
  if (base.session && !getToken()) base.session = null;
  if (!raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return base;
}

function mapItem(raw) {
  return {
    id: raw.id,
    name: raw.title ?? raw.name ?? "",
    category: raw.category ?? "",
    location: raw.location ?? "",
    status: raw.status ?? "Unclaimed",
    description: raw.description ?? "",
    photo:
      raw.image_path ||
      `https://placehold.co/640x420/e8f5ee/1b6b3a?text=${encodeURIComponent(raw.title ?? raw.name ?? "Item")}`,
    reportedBy: raw.user?.name ?? "Admin",
    date: (raw.found_date ?? raw.created_at ?? raw.date ?? "").slice(0, 10),
    contactEmail: raw.contact_email ?? "",
  };
}

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
    reportedBy: raw.user?.name ?? "",
  };
}

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
    reportedBy: raw.user?.name ?? "",
  };
}

export function createAppStore() {
  const state = reactive({
    ...loadState(),
    foundItems: [],
    lostReports: [],
    foundReports: [],
  });

  function persist() {
    const {
      foundItems: _fi,
      lostReports: _lr,
      foundReports: _fr,
      ...toSave
    } = JSON.parse(JSON.stringify(state));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  function addActivity(text) {
    state.activity.unshift({
      id: crypto.randomUUID(),
      text,
      time: new Date().toLocaleString(),
    });
    persist();
  }

  const store = {
    state,
    persist,

    // ✅ Dynamic Campus Locations System (Persistent)
    async fetchLocations() {
      try {
        const data = await api.get("/campus-locations");
        if (Array.isArray(data)) {
          state.settings.locations = data.map((loc) => loc.name || loc);
          persist();
        }
      } catch (_) {
        // Fall back to storage configurations smoothly if route isn't set up yet
      }
    },

    async addLocation(name) {
      const cleanName = sanitizeText(name, 100);
      if (!cleanName) return;

      try {
        // Send to your live database backend API route
        await api.post("/campus-locations", { name: cleanName });
      } catch (_) {
        // Local fallback so it still works if backend service is updating
      }

      if (!state.settings.locations.includes(cleanName)) {
        state.settings.locations.push(cleanName);
      }
      addActivity(`Added location: ${cleanName}`);
      persist();
    },

    async fetchItems() {
      try {
        const raw = await api.get("/items");
        state.foundItems = raw
          .filter((i) => !["Pending Approval", "Rejected"].includes(i.status))
          .map(mapItem);
      } catch (_) {}
    },

    async fetchItem(id) {
      const raw = await api.get(`/items/${id}`);
      return mapItem(raw);
    },

    async fetchMyReports() {
      try {
        const [lostRaw, foundRaw] = await Promise.all([
          api.get("/my-reports/lost"),
          api.get("/items?mine=1"),
        ]);
        state.lostReports = lostRaw.map(mapLostReport);
        state.foundReports = foundRaw.map(mapFoundReport);
      } catch (_) {}
    },

    // ✅ Fixed Crashproof Login Handler with Automated Redirect Engine
    async login(email, password, role = "user") {
      const data = await api.post("/login", {
        email: sanitizeEmail(email),
        password: String(password ?? ""),
        role,
      });
      setToken(data.token);

      const user = data?.user || data;
      if (!user)
        throw new Error("Invalid server validation payload structure.");

      state.session = {
        id: user.id || user.user_id,
        name: user.name ?? "",
        email: user.email ?? "",
        schoolId: user.school_id ?? user.schoolId ?? "",
        role: user.role ?? role,
      };
      persist();

      // Load locations immediately upon login access
      await this.fetchLocations();

      // 🚀 Redirect to Admin dashboard or normal User home based on role
      window.location.href = state.session.role === "admin" ? "/admin/users" : "/home";
    },

    // ✅ Fixed Crashproof Registration Handler with Automated Redirect Engine
    async register(payload) {
      const clean = sanitizeRegisterPayload(payload);
      if (
        !clean.name ||
        !isValidSchoolId(clean.schoolId) ||
        !isValidEmail(clean.email) ||
        !isStrongPassword(payload.password)
      ) {
        throw new Error(
          "School ID must be in format 211-00087. Password must be 8+ chars with uppercase, lowercase, and number.",
        );
      }
      const data = await api.post("/register", {
        name: clean.name,
        school_id: clean.schoolId,
        email: clean.email,
        password: payload.password,
      });
      setToken(data.token);

      const user = data?.user || data;

      state.session = {
        id: user.id || user.user_id,
        name: user.name ?? "",
        email: user.email ?? "",
        schoolId: user.school_id ?? user.schoolId ?? "",
        role: user.role ?? "user",
      };
      addActivity(`${user.name ?? "User"} registered`);
      persist();

      // 🚀 Force immediate entry to the dashboard layout once registration drops securely
      window.location.href = "/home";
    },

    // ✅ Fixed Initial System Setup Admin Account Route Redirect
    async createAdmin(payload) {
      const data = await api.post("/setup-admin", {
        name: sanitizeText(payload.name, 120),
        school_id: sanitizeText(payload.schoolId, 40),
        email: sanitizeEmail(payload.email),
        password: payload.password,
      });

      // If the setup admin response includes an authorization token, set it immediately
      if (data && data.token) {
        setToken(data.token);
      }

      addActivity("Admin account created");
      persist();

      // 🚀 Send the master admin straight through the doorway to user records control view
      window.location.href = "/admin/users";
    },

    async logout() {
      try {
        await api.post("/logout");
      } catch (_) {}
      setToken(null);
      state.session = null;
      state.foundItems = [];
      state.lostReports = [];
      state.foundReports = [];
      persist();
    },

    async changeAdminPassword(currentPassword, newPassword) {
      if (!isStrongPassword(String(newPassword ?? ""))) {
        throw new Error(
          "New password must be at least 8 characters with uppercase, lowercase, and a number.",
        );
      }
      await api.put("/password", {
        current_password: String(currentPassword ?? ""),
        new_password: String(newPassword ?? ""),
      });
      addActivity("Admin password changed");
      persist();
    },

    async addLostReport(payload) {
      const clean = sanitizeReportPayload(payload);
      if (
        !clean.name ||
        !clean.description ||
        !clean.date ||
        !isValidEmail(clean.contactEmail)
      ) {
        throw new Error("Invalid lost report input.");
      }
      const data = await api.post("/lost-reports", {
        title: clean.name,
        description: clean.description,
        category: clean.category,
        location: clean.location,
        date_lost: clean.date,
        contact_email: clean.contactEmail,
        image_path: clean.photo || null,
      });
      addActivity(`${clean.name} lost report submitted`);
      await store.fetchMyReports();
      return data?.report?.id || data?.id;
    },

    async addFoundReport(payload) {
      const clean = sanitizeReportPayload(payload);
      if (
        !clean.name ||
        !clean.description ||
        !clean.date ||
        !isValidEmail(clean.contactEmail)
      ) {
        throw new Error("Invalid found report input.");
      }
      const data = await api.post("/items", {
        title: clean.name,
        description: clean.description,
        category: clean.category,
        location: clean.location,
        found_date: clean.date,
        contact_email: clean.contactEmail,
        status: "Pending Approval",
        image_path: clean.photo || null,
      });
      addActivity(`${clean.name} found report submitted for approval`);
      await store.fetchMyReports();
      return data?.item?.id || data?.id;
    },

    async updateReport(type, id, payload) {
      const body = {};
      if (payload.name !== undefined) body.title = payload.name;
      if (payload.description !== undefined)
        body.description = payload.description;
      if (payload.status !== undefined) body.status = payload.status;
      if (payload.date !== undefined) {
        body[type === "lost" ? "date_lost" : "found_date"] = payload.date;
      }

      const endpoint = type === "lost" ? `/lost-reports/${id}` : `/items/${id}`;
      await api.patch(endpoint, body);
      await store.fetchMyReports();
    },

    async deleteReport(type, id) {
      const endpoint = type === "lost" ? `/lost-reports/${id}` : `/items/${id}`;
      await api.delete(endpoint);
      await store.fetchMyReports();
    },

    submitClaim(payload) {
      const clean = sanitizeClaimPayload(payload);
      if (
        !clean.claimantName ||
        !isValidSchoolId(clean.schoolId) ||
        !isValidEmail(clean.contactEmail) ||
        clean.proof.length < 10
      ) {
        throw new Error("Invalid claim input.");
      }
      state.claims.unshift({
        id: crypto.randomUUID(),
        ...clean,
        date: new Date().toISOString().slice(0, 10),
        status: "Pending",
        note: "",
      });
      addActivity(
        `${clean.claimantName} submitted a claim for ${clean.itemName}`,
      );
    },

    async approveFoundReport(id) {
      await api.patch(`/items/${id}`, { status: "Unclaimed" });
      addActivity("Found report approved and published");
      persist();
      await store.fetchItems();
    },

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
    },
  };

  return store;
}

export const appStoreKey = Symbol("campus-lost-found-store");