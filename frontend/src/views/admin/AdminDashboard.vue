<script setup>
import { CheckCircle, ClipboardList, Package, Users } from "lucide-vue-next";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ActivityFeed from "../../components/shared/ActivityFeed.vue";
import DashboardCard from "../../components/shared/DashboardCard.vue";
import { useStore } from "../../composables/useStore";

const { state } = useStore();
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">Admin Dashboard</h1>
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardCard :icon="Package" :number="state.foundItems.length" label="Total Found Items" />
      <DashboardCard :icon="ClipboardList" :number="state.foundItems.filter((i) => i.status === 'Unclaimed').length" label="Unclaimed" />
      <DashboardCard :icon="Users" :number="state.claims.filter((c) => c.status === 'Pending').length" label="Pending Claims" />
      <DashboardCard :icon="CheckCircle" :number="state.foundItems.filter((i) => i.status === 'Claimed').length" label="Resolved This Month" />
    </section>
    <section class="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ActivityFeed :items="state.activity" />
      <div class="rounded-md bg-white p-5 shadow-soft">
        <h2 class="text-lg font-bold text-dark">Quick Actions</h2>
        <div class="mt-4 grid gap-2">
          <RouterLink class="btn-primary" to="/admin/items">Manage Items</RouterLink>
          <RouterLink class="btn-secondary" to="/admin/claims">Review Claims</RouterLink>
          <RouterLink class="btn-secondary" to="/admin/users">Manage Users</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>
