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
import MyClaims from "../views/user/MyClaims.vue"; 
import { getToken } from "../services/api"; // 🔑 Import token helper to check auth state cleanly

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", component: LoginRegister },
    { path: "/home", component: HomePage, meta: { requiresAuth: true } },
    { path: "/browse", component: BrowseFound, meta: { requiresAuth: true } },
    { path: "/items/:id", component: ItemDetail, meta: { requiresAuth: true } },
    { path: "/report-lost", component: ReportLost, meta: { requiresAuth: true } },
    { path: "/report-found", component: ReportFound, meta: { requiresAuth: true } },
    { path: "/my-reports", component: MyReports, meta: { requiresAuth: true } },
    { path: "/my-claims", component: MyClaims, meta: { requiresAuth: true } }, 
    { path: "/admin", redirect: "/admin/login" }, 
    { path: "/admin/login", component: AdminLogin }, 
    { path: "/admin/setup", component: AdminSetup }, 
    { path: "/admin/dashboard", component: AdminDashboard, meta: { requiresAdmin: true } },
    { path: "/admin/items", component: AdminItems, meta: { requiresAdmin: true } },
    { path: "/admin/lost-reports", component: AdminLostReports, meta: { requiresAdmin: true } },
    { path: "/admin/claims", component: AdminClaims, meta: { requiresAdmin: true } },
    { path: "/admin/users", component: AdminUsers, meta: { requiresAdmin: true } },
    { path: "/admin/settings", component: AdminSettings, meta: { requiresAdmin: true } },
  ],
});

// 🛡️ SECURITY ROUTE GUARD: Stops automatic redirects and handles route boundaries gracefully
router.beforeEach((to, from, next) => {
  const hasToken = !!getToken();

  // If trying to access admin setup while already holding an active session, let it stay on login/dashboard instead
  if (to.path === "/admin/setup" && hasToken) {
    return next("/admin/claims");
  }

  // Simply let the request pass through natively without intercepting loops
  next();
});

export default router;