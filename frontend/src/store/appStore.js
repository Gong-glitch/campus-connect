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
    announcementText: "Claim found items at the student affairs office with a valid ID.",
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
  return { ...initialData, session: base.session };
}

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

export function createAppStore() {
  const state = reactive({
    ...loadState(),
    foundItems: [],
    lostReports: [],
    foundReports: [],
  });

  function persistSession() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ session: state.session }));
  }

  const store = {
    state,

    async login(email, password, role = "user") {
      const data = await api.post("/login", {
        email: sanitizeEmail(email),
        password: String(password ?? ""),
        role,
      });
      const token = data.token || data.data?.token;
      setToken(token);
      const user = data?.user || data?.data?.user || data;
      state.session = {
        id: user.id || user.user_id,
        name: user.name ?? "",
        email: user.email ?? "",
        schoolId: user.school_id ?? user.schoolId ?? "",
        role: user.role ?? role,
      };
      persistSession();
      window.location.href = state.session.role === "admin" ? "/admin/claims" : "/home";
    },

    async register(payload) {
      const clean = sanitizeRegisterPayload(payload);
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
      persistSession();
      window.location.href = "/home";
    },

    async logout() {
      try { await api.post("/logout"); } catch (_) {}
      setToken(null);
      state.session = null;
      state.claims = [];
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = "/login";
    },

    async fetchItems() {
      try {
        const raw = await api.get("/items");
        state.foundItems = raw.map(mapItem);
      } catch (_) {}
    },

    // 🟢 ADMIN: Fetches system-wide database claims with relationships mapped out
    async fetchAdminClaims() {
      try {
        const data = await api.get("/admin/claims");
        if (Array.isArray(data)) {
          state.claims = data.map(claim => ({
            id: claim.id,
            itemId: claim.item_id,
            itemName: claim.item?.title || claim.item?.name || "Unknown Item",
            claimantName: claim.user?.name || "Unknown Student",
            schoolId: claim.user?.school_id || "N/A",
            proof: claim.proof_text || "",
            date: (claim.created_at || "").slice(0, 10),
            status: claim.status || "Pending",
            note: claim.admin_notes || ""
          }));
        }
      } catch (error) {
        console.error("Failed admin claims sync:", error);
      }
    },

    // 🟢 STUDENT: Fetches the logged-in student's claims
    async fetchMyClaims() {
      try {
        const data = await api.get("/my-claims"); 
        if (Array.isArray(data)) {
          state.claims = data.map(claim => ({
            id: claim.id,
            itemId: claim.item_id,
            itemName: claim.item?.title || claim.item?.name || "Unknown Item",
            claimantName: "Me",
            schoolId: state.session?.schoolId || "N/A",
            proof: claim.proof_text || "",
            date: (claim.created_at || "").slice(0, 10),
            status: claim.status || "Pending",
            note: claim.admin_notes || ""
          }));
        }
      } catch (error) {
        console.error("Failed student claims sync:", error);
        state.claims = [];
      }
    },

    // 🟢 SUBMIT CLAIM FORM PIPELINE
    async submitClaim(payload) {
      await api.post("/claims", {
        item_id: payload.itemId,                       
        proof_text: payload.proof,             
      });
      await this.fetchItems();
    },

    async updateClaim(id, status, note = "") {
      try {
        await api.patch(`/claims/${id}`, {
          status: status,                                                 
          admin_notes: note
        });
        await this.fetchAdminClaims();
      } catch (error) {
        console.error("Error updating claim:", error);
      }
    },

    async deleteClaim(id) {
      try {
        await api.delete(`/claims/${id}`);
        state.claims = state.claims.filter((item) => item.id !== id);
      } catch (error) {
        console.error("Error deleting claim:", error);
      }
    }
  };

  return store;
}

export const appStoreKey = Symbol("campus-lost-found-store");