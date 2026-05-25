<script setup>
import AdminTable from "../../components/shared/AdminTable.vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
const columns = [
  { key: "name", label: "Name" },
  { key: "schoolId", label: "School ID" },
  { key: "email", label: "Email" },
  { key: "reportsCount", label: "Reports Count" },
  { key: "status", label: "Status" },
  { key: "joinDate", label: "Join Date" }
];

function reportsCount(user) {
  return store.state.lostReports.filter((r) => r.ownerEmail === user.email).length + store.state.foundReports.filter((r) => r.ownerEmail === user.email).length;
}
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">User Management</h1>
    <AdminTable :columns="columns" :rows="store.state.users">
      <template #reportsCount="{ row }">{{ reportsCount(row) }}</template>
      <template #status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #actions="{ row }">
        <div class="flex gap-2">
          <button class="btn-secondary px-3 py-1.5" @click="alert(`${row.name}\n${row.email}`)">View</button>
          <button class="btn-secondary px-3 py-1.5" @click="store.updateUser(row.id, { status: row.status === 'Suspended' ? 'Active' : 'Suspended' })">Suspend</button>
          <button class="btn-danger px-3 py-1.5" @click="store.deleteUser(row.id)">Delete</button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>
