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
import MyClaims from "../views/user/MyClaims.vue"; // 🚀 ADDED: Import student claims tracking page

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", component: LoginRegister },
    { path: "/home", component: HomePage },
    { path: "/browse", component: BrowseFound },
    { path: "/items/:id", component: ItemDetail },
    { path: "/report-lost", component: ReportLost },
    { path: "/report-found", component: ReportFound },
    { path: "/my-reports", component: MyReports },
    { path: "/my-claims", component: MyClaims }, // 🚀 ADDED: Route path for student claims tracking screen
    { path: "/admin", redirect: "/admin/login" }, 
    { path: "/admin/login", component: AdminLogin }, 
    { path: "/admin/setup", component: AdminSetup }, 
    { path: "/admin/dashboard", component: AdminDashboard },
    { path: "/admin/items", component: AdminItems },
    { path: "/admin/lost-reports", component: AdminLostReports },
    { path: "/admin/claims", component: AdminClaims },
    { path: "/admin/users", component: AdminUsers },
    { path: "/admin/settings", component: AdminSettings },
  ],
});

export default router;