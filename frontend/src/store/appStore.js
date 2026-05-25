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

const STORAGE_KEY = "campus-lost-found-csu-v2";

const categories = ["Electronics", "Keys", "ID", "Clothing", "Bag", "Others"];
const locations = ["Main Campus Gate", "CCIS Building", "Library", "Gymnasium", "Cafeteria", "Registrar", "Student Center"];

const foundItems = [
  ["found-1", "Scientific Calculator", "Electronics", "CCIS Building", "Unclaimed"],
  ["found-2", "Student ID Card", "ID", "Library", "Unclaimed"],
  ["found-3", "Black Backpack", "Bag", "Student Center", "Pending"],
  ["found-4", "Silver USB Drive", "Electronics", "Computer Lab", "Unclaimed"],
  ["found-5", "House Keys", "Keys", "Cafeteria", "Claimed"],
  ["found-6", "Green Jacket", "Clothing", "Gymnasium", "Unclaimed"],
  ["found-7", "Wireless Earbuds", "Electronics", "Main Campus Gate", "Unclaimed"],
  ["found-8", "Blue Umbrella", "Others", "Registrar", "Claimed"],
  ["found-9", "Notebook Set", "Others", "Library", "Unclaimed"],
  ["found-10", "Wallet", "Others", "Cafeteria", "Pending"],
  ["found-11", "Motorcycle Key", "Keys", "Parking Area", "Unclaimed"],
  ["found-12", "PE Uniform Shirt", "Clothing", "Gymnasium", "Unclaimed"]
].map(([id, name, category, location, status], index) => ({
  id,
  name,
  category,
  location,
  status,
  reportedBy: index % 2 ? "Security Office" : "Student Affairs",
  date: `2026-05-${String(10 + index).padStart(2, "0")}`,
  description: `${name} was turned over to the lost and found desk. Claimants must provide proof of ownership.`,
  photo: `https://placehold.co/640x420/e8f5ee/1b6b3a?text=${encodeURIComponent(name)}`
}));

const initialData = {
  session: null,
  users: [],
  foundItems,
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
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return { ...initialData, ...JSON.parse(raw) };
}

export function createAppStore() {
  const state = reactive(loadState());
  state.foundReports = state.foundReports.map((report) =>
    report.status === "Pending" ? { ...report, status: "Pending Approval" } : report
  );

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function addActivity(text) {
    state.activity.unshift({ id: crypto.randomUUID(), text, time: new Date().toLocaleString() });
    persist();
  }

  function toPublicFoundItem(report, reviewer = "Admin") {
    return {
      id: report.id,
      sourceReportId: report.id,
      name: report.name,
      category: report.category,
      location: report.location,
      date: report.date,
      status: "Unclaimed",
      reportedBy: reviewer,
      description: report.description,
      photo: report.photo || `https://placehold.co/640x420/e8f5ee/1b6b3a?text=${encodeURIComponent(report.name)}`,
      contactEmail: report.contactEmail
    };
  }

  const store = {
    state,
    persist,
    login(email, password, role = "user") {
      const cleanEmail = sanitizeEmail(email);
      const cleanPassword = String(password ?? "");
      const user = state.users.find((item) => item.email === cleanEmail && item.password === cleanPassword && item.role === role);
      if (!user) throw new Error("Invalid credentials for this role.");
      state.session = { id: user.id, name: user.name, email: user.email, schoolId: user.schoolId, role: user.role };
      persist();
    },
    register(payload) {
      const clean = sanitizeRegisterPayload(payload);
      if (!clean.name || !isValidSchoolId(clean.schoolId) || !isValidEmail(clean.email) || !isStrongPassword(clean.password)) {
        throw new Error("Invalid registration details.");
      }
      if (state.users.some((user) => user.email === clean.email)) throw new Error("Email already exists.");
      const user = { id: crypto.randomUUID(), ...clean, role: "user", status: "Active", joinDate: new Date().toISOString().slice(0, 10) };
      state.users.push(user);
      state.session = { id: user.id, name: user.name, email: user.email, schoolId: user.schoolId, role: "user" };
      addActivity(`${user.name} registered`);
      persist();
    },
    createAdmin(payload) {
      if (state.users.some((u) => u.role === "admin")) throw new Error("An admin account already exists.");
      const name = sanitizeText(payload.name, 120);
      const schoolId = sanitizeText(payload.schoolId, 40);
      const email = sanitizeEmail(payload.email);
      const password = String(payload.password ?? "");
      if (!name || !isValidSchoolId(schoolId) || !isValidEmail(email) || !isStrongPassword(password)) {
        throw new Error("Invalid admin details.");
      }
      const user = { id: crypto.randomUUID(), name, schoolId, email, password, role: "admin", status: "Active", joinDate: new Date().toISOString().slice(0, 10) };
      state.users.push(user);
      addActivity(`Admin account created for ${name}`);
      persist();
    },
    logout() {
      state.session = null;
      persist();
    },
    addLostReport(payload) {
      const clean = sanitizeReportPayload(payload);
      if (!clean.name || !clean.description || !clean.date || !isValidEmail(clean.contactEmail)) {
        throw new Error("Invalid lost report input.");
      }
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
          state.foundItems = state.foundItems.filter((item) => item.sourceReportId !== id && item.id !== id);
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
    addFoundItem(payload) {
      const clean = sanitizeReportPayload(payload);
      if (!clean.name || !clean.description || !clean.date) {
        throw new Error("Invalid item input.");
      }
      state.foundItems.unshift({
        id: crypto.randomUUID(),
        ...payload,
        ...clean,
        contactEmail: clean.contactEmail || state.session?.email || "admin@local"
      });
      addActivity(`${clean.name} added by admin`);
    },
    approveFoundReport(id) {
      const report = state.foundReports.find((item) => item.id === id);
      if (!report) return;
      report.status = "Approved";
      const publicItem = toPublicFoundItem(report, state.session?.name || "Admin");
      const existingIndex = state.foundItems.findIndex((item) => item.sourceReportId === id || item.id === id);
      if (existingIndex >= 0) {
        state.foundItems[existingIndex] = { ...state.foundItems[existingIndex], ...publicItem };
      } else {
        state.foundItems.unshift(publicItem);
      }
      addActivity(`${report.name} approved and posted`);
      persist();
    },
    rejectFoundReport(id) {
      const report = state.foundReports.find((item) => item.id === id);
      if (!report) return;
      report.status = "Rejected";
      state.foundItems = state.foundItems.filter((item) => item.sourceReportId !== id && item.id !== id);
      addActivity(`${report.name} rejected`);
      persist();
    },
    updateFoundItem(id, payload) {
      const index = state.foundItems.findIndex((item) => item.id === id);
      if (index >= 0) {
        const current = state.foundItems[index];
        const merged = { ...current, ...payload };
        const clean = sanitizeReportPayload(merged);
        state.foundItems[index] = { ...merged, ...clean };
      }
      persist();
    },
    deleteFoundItem(id) {
      state.foundItems = state.foundItems.filter((item) => item.id !== id);
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
