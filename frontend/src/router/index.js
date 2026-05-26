import { createRouter, createWebHistory } from "vue-router";
import AdminClaims from "../views/admin/AdminClaims.vue";
import AdminDashboard from "../views/admin/AdminDashboard.vue";
import AdminItems from "../views/admin/AdminItems.vue";
import AdminLogin from "../views/admin/AdminLogin.vue";
import AdminSetup from "../views/admin/AdminSetup.vue";
import AdminLostReports from "../views/admin/AdminLostReports.vue";
import AdminSettings from "../views/admin/AdminSettings.vue";
import AdminUsers from "../views/admin/AdminUsers.vue";
import BrowseFound from "../views/user/BrowseFound.vue";
import HomePage from "../views/user/HomePage.vue";
import ItemDetail from "../views/user/ItemDetail.vue";
import LoginRegister from "../views/user/LoginRegister.vue";
import MyReports from "../views/user/MyReports.vue";
import ReportFound from "../views/user/ReportFound.vue";
import ReportLost from "../views/user/ReportLost.vue";

const TOKEN_KEY = "campus-auth-token";
const STORAGE_KEY = "campus-lost-found-csu-v2";

// Routes that never require a token
const PUBLIC_PATHS = new Set(["/", "/login", "/admin", "/admin/setup"]);
// Protected admin route prefix
const ADMIN_PREFIX = "/admin/";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/",                 redirect: "/login" },
    { path: "/login",             component: LoginRegister },
    { path: "/home",              component: HomePage },
    { path: "/browse",            component: BrowseFound },
    { path: "/items/:id",         component: ItemDetail },
    { path: "/report-lost",       component: ReportLost },
    { path: "/report-found",      component: ReportFound },
    { path: "/my-reports",        component: MyReports },
    { path: "/admin",             component: AdminLogin },
    { path: "/admin/setup",       component: AdminSetup },
    { path: "/admin/dashboard",   component: AdminDashboard },
    { path: "/admin/items",       component: AdminItems },
    { path: "/admin/lost-reports",component: AdminLostReports },
    { path: "/admin/claims",      component: AdminClaims },
    { path: "/admin/users",       component: AdminUsers },
    { path: "/admin/settings",    component: AdminSettings }
  ]
});

router.beforeEach((to) => {
  // 1. Always allow public pages through without a token check
  if (PUBLIC_PATHS.has(to.path)) return true;

  // 2. Fetch token and active session storage object safely
  const hasToken = Boolean(localStorage.getItem(TOKEN_KEY));
  const rawStore = localStorage.getItem(STORAGE_KEY);
  let userRole = "user";

  try {
    if (rawStore) {
      const parsed = JSON.parse(rawStore);
      if (parsed?.session?.role) {
        userRole = parsed.session.role;
      }
    }
  } catch (_) {}

  // 3. If authenticated, verify authority scopes
  if (hasToken) {
    const isTargetingAdmin = to.path.startsWith(ADMIN_PREFIX);

    // Regular students attempting to reach admin tools get bounced to home
    if (isTargetingAdmin && userRole !== "admin") {
      return "/home";
    }
    return true;
  }

  // 4. No token present — redirect to corresponding login panels cleanly
  const isAdminRoute = to.path.startsWith(ADMIN_PREFIX);
  return isAdminRoute ? "/admin" : "/login";
});