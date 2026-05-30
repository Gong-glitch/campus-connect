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

// Only retains session handshake tracking so users don't have to re-login on refresh
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const saved = raw ? JSON.parse(raw) : null;
  const base = saved ? { ...initialData, ...saved } : { ...initialData };

  if (base.session && !getToken()) {
    base.session = null;
  }
  return {
    ...initialData,
    session: base.session
  };
}

// 🖼️ Re-routed to fetch images natively via your Render Backend streaming utility route
function formatImagePath(photoUrl) {
  if (photoUrl && !photoUrl.startsWith("http")) {
    const cleanPath = photoUrl.replace(/^\/?(storage\/)?/, "");
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

  // Persists session token identifiers only, keeping database listings out of local cache
  function persistSession() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ session: state.session }));
  }

  function addActivity(text) {
    state.activity.unshift({
      id: crypto.randomUUID(),
      text,
      time: new Date().toLocaleString(),
    });
  }

  const store = {
    state,

    async fetchLocations() {
      try {
        const data = await api.get("/campus-locations");
        if (Array.isArray(data)) {
          state.settings.locations = data.map((loc) => loc.name || loc);
        }
      } catch (_) {}
    },

    async addLocation(name) {
      const cleanName = sanitizeText(name, 100);
      if (!cleanName) return;
      try {
        await api.post("/campus-locations", { name: cleanName });
        if (!state.settings.locations.includes(cleanName)) {
          state.settings.locations.push(cleanName);
        }
        addActivity(`Added location: ${cleanName}`);
      } catch (_) {}
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

    // 🟢 FETCH LIVE USERS FROM DB (No local storage pollution)
    async fetchUsers() {
      try {
        const data = await api.get("/admin/users");
        if (Array.isArray(data)) {
          state.users = data.map(user => ({
            id: user.id,
            name: user.name,
            schoolId: user.school_id || user.schoolId || "N/A",
            email: user.email,
            date: (user.created_at || "").slice(0, 10),
            status: user.status || "Active"
          }));
        }
      } catch (error) {
        console.error("Failed to fetch database users:", error);
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

      persistSession(); 
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

      persistSession(); 
      window.location.href = "/home";
    },

    async createAdmin(payload) {
      await api.post("/setup-admin", {
        name: sanitizeText(payload.name, 120),
        school_id: sanitizeText(payload.schoolId, 40),
        email: sanitizeEmail(payload.email),
        password: payload.password,
      });
      addActivity("Admin account created");
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
      state.users = [];
      state.claims = [];
      localStorage.removeItem(STORAGE_KEY);
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

    async fetchAdminClaims() {
      try {
        const data = await api.get("/admin/claims");
        if (Array.isArray(data)) {
          state.claims = data.map(claim => ({
            id: claim.id,
            itemId: claim.item_id,
            itemName: claim.item?.title || claim.item?.name || "Unknown Asset",
            claimantName: claim.user?.name || "Unknown Student",
            schoolId: claim.user?.school_id || "N/A",
            contactEmail: claim.user?.email || "",
            proof: claim.proof_text || claim.proof_of_ownership || "",
            date: (claim.created_at || claim.claim_date || "").slice(0, 10),
            status: claim.status || "Pending",
            note: claim.admin_notes || ""
          }));
        }
      } catch (error) {
        console.error("Failed to query system verification claim rows:", error);
      }
    },

    // 🟢 DYNAMICALLY TARGETS YOUR LIVE /api/my-claims ENDPOINT
    async fetchMyClaims() {
      try {
        const data = await api.get("/my-claims"); 
        if (Array.isArray(data)) {
          state.claims = data.map(claim => ({
            id: claim.id,
            itemId: claim.item_id,
            itemName: claim.item?.title || claim.item?.name || "Unknown Asset",
            claimantName: claim.user?.name || "Me",
            user_id: claim.user_id || claim.user?.id, 
            schoolId: claim.user?.school_id || "N/A",
            contactEmail: claim.user?.email || "",
            proof: claim.proof_text || claim.proof_of_ownership || "",
            date: (claim.created_at || claim.claim_date || "").slice(0, 10),
            status: claim.status || "Pending",
            note: claim.admin_notes || ""
          }));
        }
      } catch (error) {
        console.error("Failed to query student database claim rows:", error);
        state.claims = [];
      }
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

      await api.post("/claims", {
        item_id: clean.itemId,                       
        proof_text: clean.proof,             
      });

      addActivity(`${clean.claimantName} submitted database claim row for ${clean.itemName}`);
    },

    async approveFoundReport(id) {
      await api.patch(`/items/${id}`, { status: "Unclaimed" });
      addActivity("Found report approved and published");
      await store.fetchItems();
    },

    async rejectFoundReport(id) {
      await api.patch(`/items/${id}`, { status: "Rejected" });
      addActivity("Found report rejected");
    },

    async updateClaim(id, status, note = "") {
      const claim = state.claims.find((item) => item.id === id);
      if (!claim) return;

      try {
        await api.patch(`/claims/${id}`, {
          status: status,                                                 
          admin_notes: note
        });

        claim.status = status;
        claim.note = note;

        if (status === "Approved") {
          const found = state.foundItems.find((item) => item.id === claim.itemId);
          if (found) found.status = "Resolved";
        } else if (status === "Rejected") {
          const found = state.foundItems.find((item) => item.id === claim.itemId);
          if (found) found.status = "Found";
        }
        addActivity(`${claim.itemName} claim row updated to status: ${status.toLowerCase()}`);
      } catch (error) {
        console.error("Failed to execute claim condition modification:", error);
      }
    },

    async deleteClaim(id) {
      try {
        await api.delete(`/claims/${id}`);
        state.claims = state.claims.filter((item) => item.id !== id);
        addActivity(`Permanently dropped verification claim entry reference: ${id}`);
      } catch (error) {
        console.error("Failed to execute claim row database purge action:", error);
        state.claims = state.claims.filter((item) => item.id !== id);
      }
    },

    async updateUserStatus(id, status) {
      try {
        await api.patch(`/admin/users/${id}`, { status });
        const user = state.users.find((item) => item.id === id);
        if (user) {
          user.status = status;
        }
        addActivity(`Modified student account profile status state to: ${status}`);
      } catch (error) {
        console.error("Failed to execute status update payload pipeline:", error);
      }
    },

    async deleteUserAccount(id) {
      try {
        await api.delete(`/admin/users/${id}`);
        state.users = state.users.filter((item) => item.id !== id);
        addActivity(`Dropped user registry identifier row record directly inside DB: ${id}`);
      } catch (error) {
        console.error("Failed to delete user account across the database layer:", error);
      }
    },

    saveSettings(settings) {
      state.settings = { ...state.settings, ...settings };
      addActivity("Settings updated");
    },
  };

  return store;
}

export const appStoreKey = Symbol("campus-lost-found-store");