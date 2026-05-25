const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCHOOL_ID_RE = /^\d{3}-\d{5}$/;
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function sanitizeText(value, maxLen = 200) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeEmail(value) {
  return sanitizeText(value, 120).toLowerCase();
}

export function sanitizeDate(value) {
  const date = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value ?? ""));
}

export function isValidSchoolId(value) {
  return SCHOOL_ID_RE.test(String(value ?? ""));
}

export function isStrongPassword(value) {
  return STRONG_PASSWORD_RE.test(String(value ?? ""));
}

export function sanitizeReportPayload(payload) {
  return {
    name: sanitizeText(payload.name, 120),
    category: sanitizeText(payload.category, 40),
    description: sanitizeText(payload.description, 1000),
    location: sanitizeText(payload.location, 120),
    date: sanitizeDate(payload.date),
    contactEmail: sanitizeEmail(payload.contactEmail),
    photo: typeof payload.photo === "string" ? payload.photo : ""
  };
}

export function sanitizeClaimPayload(payload) {
  return {
    claimantName: sanitizeText(payload.claimantName, 120),
    schoolId: sanitizeText(payload.schoolId, 40),
    contactEmail: sanitizeEmail(payload.contactEmail),
    proof: sanitizeText(payload.proof, 1000),
    itemId: sanitizeText(payload.itemId, 80),
    itemName: sanitizeText(payload.itemName, 120)
  };
}

export function sanitizeRegisterPayload(payload) {
  return {
    name: sanitizeText(payload.name, 120),
    schoolId: sanitizeText(payload.schoolId, 40),
    email: sanitizeEmail(payload.email),
    password: String(payload.password ?? "").slice(0, 120)
  };
}
