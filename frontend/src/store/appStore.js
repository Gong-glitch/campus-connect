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
// 🎯 Explicitly map image assets to your live Render backend API domain
const BACKEND_BASE = "https://campus-connect-api-0s3b.onrender.com";

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
    locations: defaultLocations, 
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

  if (base.session && !getToken()) {
    base.session = null;
  }
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  }
  return base;
}

// 🖼️ Re-routed to fetch images natively via your Render Backend streaming utility route
function formatImagePath(photoUrl) {
  if (photoUrl && !photoUrl.startsWith("http")) {
    // Strip out any redundant leading slashes or old "storage/" prefix markers
    const cleanPath = photoUrl.replace(/^\/?(storage\/)?/, "");

    // Force requests to point to your streaming endpoint at /api/storage/...
    return `${BACKEND_BASE}/api/storage/${cleanPath}`;
  }
  return photoUrl;
}

function mapItem(raw) {
  const photoUrl = formatImagePath(raw.image_path);
  return {
    id: raw.id,
    name: raw.title ?? raw.name ?? "",
    category: raw.category ?? "",
    location: raw.location ?? "",
    status: raw.status ?? "Unclaimed",
    description: raw.description ?? "",
    photo: photoUrl || `https://placehold.co/640x420/e8f5ee/1b6b3a?text=${encodeURIComponent(raw.title ?? raw.name ?? "Item")}`,
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
    photo: formatImagePath(raw.image_path) || "",
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
    date: raw.found_date || raw.date_lost || (raw.created_at ?? "").slice(0, 10),
    description: raw.description ?? "",
    photo: formatImagePath(raw.image_path) || "",
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

    async fetchLocations() {
      try {
        const data = await api.get("/campus-locations");
        if (Array.isArray(data)) {
          state.settings.locations = data.map((loc) => loc.name || loc);
          persist();
        }
      } catch (_) {}
    },

    async addLocation(name) {
      const cleanName = sanitizeText(name, 100);
      if (!cleanName) return;
      try {
        await api.post("/campus-locations", { name: cleanName });
      } catch (_) {}

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
        const lostRaw = await api.get("/my-lost-reports").catch(() => []);
        state.lostReports = Array.isArray(lostRaw) ? lostRaw.map(mapLostReport) : [];
      } catch (_) {
        state.lostReports = [];
      }

      try {
        const foundRaw = await api.get("/my-found-reports").catch(() => []);
        state.foundReports = Array.isArray(foundRaw) ? foundRaw.map(mapFoundReport) : [];
      } catch (_) {
        state.foundReports = [];
      }
    },

    async login(email, password, role = "user") {
      const data = await api.post("/login", {
        email: sanitizeEmail(email),
        password: String(password ?? ""),
        role,
      });

      const token = data.token || data.data?.token;
      setToken(token);

      const user = data?.user || data?.data?.user || data;
      if (!user) throw new Error("Invalid server validation payload structure.");

      state.session = {
        id: user.id || user.user_id,
        name: user.name ?? "",
        email: user.email ?? "",
        schoolId: user.school_id ?? user.schoolId ?? "",
        role: user.role ?? role,
      };

      persist(); 

      await this.fetchLocations();
      window.location.href = state.session.role === "admin" ? "/admin/users" : "/home";
    },

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

      const token = data.token || data.data?.token;
      setToken(token);

      const user = data?.user || data?.data?.user || data;
      state.session = {
        id: user.id || user.user_id,
        name: user.name ?? "",
        email: user.email ?? "",
        schoolId: user.school_id ?? user.schoolId ?? "",
        role: user.role ?? "user",
      };
      addActivity(`${user.name ?? "User"} registered`);

      persist(); 
      window.location.href = "/home";
    },

    async createAdmin(payload) {
      const data = await api.post("/setup-admin", {
        name: sanitizeText(payload.name, 120),
        school_id: sanitizeText(payload.schoolId, 40),
        email: sanitizeEmail(payload.email),
        password: payload.password,
      });

      const token = data.token || data.data?.token;
      if (token) setToken(token);
      addActivity("Admin account created");
      persist();
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
        throw new Error("New password must be at least 8 characters with uppercase, lowercase, and a number.");
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
      const imagePath = payload.image_path || clean.photo || null;

      const data = await api.post("/lost-reports", {
        title: payload.title || clean.name,
        description: payload.description || clean.description,
        category: payload.category || clean.category,
        location: payload.location || clean.location,
        date_lost: payload.date_lost || clean.date,
        contact_email: payload.contact_email || clean.contactEmail,
        image_path: imagePath,
      });
      addActivity(`${payload.title || clean.name} lost report submitted`);
      await store.fetchMyReports();
      return data?.report?.id || data?.id;
    },

    async addFoundReport(payload) {
      const clean = sanitizeReportPayload(payload);
      const imagePath = payload.image_path || clean.photo || null;

      const data = await api.post("/items", {
        title: payload.title || clean.name,
        description: payload.description || clean.description,
        category: payload.category || clean.category,
        location: payload.location || clean.location,
        found_date: payload.date_lost || payload.date || clean.date,
        contact_email: payload.contact_email || clean.contactEmail,
        status: "Pending Approval",
        image_path: imagePath,
      });

      addActivity(`${payload.title || clean.name} found report submitted`);
      await store.fetchMyReports();
      return data;
    },

    async updateReport(type, id, payload) {
      const body = {};
      if (payload.name !== undefined) body.title = payload.name;
      if (payload.description !== undefined) body.description = payload.description;
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

    async submitClaim(payload) {
      const clean = sanitizeClaimPayload(payload);
      if (
        !clean.claimantName ||
        !isValidSchoolId(clean.schoolId) ||
        !isValidEmail(clean.contactEmail) ||
        clean.proof.length < 10
      ) {
        throw new Error("Invalid claim input.");
      }

      const claimData = {
        id: crypto.randomUUID(),                     
        item_id: clean.itemId,                       
        user_id: state.session?.id || null,          
        proof_of_ownership: clean.proof,             
        status: "Pending",                            
        claim_date: new Date().toISOString().slice(0, 10)
      };

      try {
        await api.post("/claims", claimData);
      } catch (_) {}

      state.claims.unshift({
        id: claimData.id,
        itemId: clean.itemId,
        itemName: clean.itemName,
        claimantName: clean.claimantName,
        schoolId: clean.schoolId,
        contactEmail: clean.contactEmail,
        proof: clean.proof,
        date: claimData.claim_date,
        status: "Pending",
        note: "",
      });

      addActivity(`${clean.claimantName} submitted database claim row for ${clean.itemName}`);
      persist();
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

    async updateClaim(id, status, note = "") {
      const claim = state.claims.find((item) => item.id === id);
      if (!claim) return;

      const updatePayload = {
        status: status,                                
        actioned_by: state.session?.id || "admin",   
        actioned_at: new Date().toISOString().slice(0, 10),
        admin_notes: note
      };

      try {
        await api.patch(`/claims/${id}`, updatePayload);
      } catch (_) {}

      claim.status = status;
      claim.note = note;

      if (status === "Approved") {
        const found = state.foundItems.find((item) => item.id === claim.itemId);
        if (found) found.status = "Claimed";
        try {
          await api.patch(`/items/${claim.itemId}`, { status: "Claimed" });
        } catch (_) {}
      } else if (status === "Rejected") {
        const found = state.foundItems.find((item) => item.id === claim.itemId);
        if (found) found.status = "Unclaimed";
        try {
          await api.patch(`/items/${claim.itemId}`, { status: "Unclaimed" });
        } catch (_) {}
      }

      addActivity(`${claim.itemName} claim row updated to status: ${status.toLowerCase()}`);
      persist();
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