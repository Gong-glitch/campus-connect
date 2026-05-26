import { createRouter, createWebHistory } from "vue-router";

// 1. Core Module View Components Imports
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

// 2. Global State Storage Key Handlers
const TOKEN_KEY = "campus-auth-token";
const STORAGE_KEY = "campus-lost-found-csu-v2";

// Routes accessible without any authentication tokens
const PUBLIC_PATHS = new Set(["/", "/login", "/admin", "/admin/setup"]);
// Protected admin route namespace prefix
const ADMIN_PREFIX = "/admin/";

// 3. Router Mapping Matrix Definitions
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/",                 redirect: "/login" },
    { path: "/login",            component: LoginRegister },
    { path: "/home",             component: HomePage },
    { path: "/browse",           component: BrowseFound },
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

// 4. Global Navigation Interceptor Guard Guardrails Engine
router.beforeEach((to) => {
  // Always let users navigate directly to public authentication forms
  if (PUBLIC_PATHS.has(to.path)) return true;

  // Read local storage state drivers uniformly
  const rawStore = localStorage.getItem(STORAGE_KEY);
  let hasToken = Boolean(localStorage.getItem(TOKEN_KEY));
  let userRole = "user";

  try {
    if (rawStore) {
      const parsed = JSON.parse(rawStore);

      // Fallback crosscheck: verify token properties within states
      if (parsed?.session?.token || parsed?.token) {
        hasToken = true;
      }

      // Strict role extraction mapping fallbacks
      if (parsed?.session?.role) {
        userRole = parsed.session.role;
      } else if (parsed?.user?.role) {
        userRole = parsed.user.role;
      }
    }
  } catch (error) {
    console.warn("Router guard storage engine parse fallback warning:", error);
  }

  // Handle active session traffic rules
  if (hasToken) {
    const isTargetingAdmin = to.path.startsWith(ADMIN_PREFIX);

    // Bounce authenticated users out of login modules directly to their platforms
    if (to.path === "/login" || to.path === "/admin") {
      return userRole === "admin" ? "/admin/dashboard" : "/home";
    }

    // Shield Admin tools from unauthorized Student accounts
    if (isTargetingAdmin && userRole !== "admin") {
      return "/home";
    }

    // Auto-route System Admins into the monitoring command center panel if they click the home link
    if (!isTargetingAdmin && userRole === "admin" && to.path === "/home") {
      return "/admin/dashboard";
    }

    return true;
  }

  // Fallback Rule: Session does not exist -> redirect to appropriate login portal safely
  return to.path.startsWith(ADMIN_PREFIX) ? "/admin" : "/login";
});

// 🚀 DUAL EXPORTS: Fixes named imports like { router } and fallback defaults simultaneously
export { router };
export default router;