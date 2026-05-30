<script setup>
import { onMounted } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import AdminTable from "../../components/shared/AdminTable.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";

const store = useStore();

const columns = [
  { key: "name",     label: "Full Name" },
  { key: "schoolId", label: "School ID" },
  { key: "email",    label: "School Email" },
  { key: "date",     label: "Join Date" },
  { key: "status",   label: "System Status" }
];

// Fetch fresh users from the backend MySQL/PostgreSQL DB when page mounts
onMounted(async () => {
  await store.fetchUsers();
});

// Sends status changes (Active/Suspended) directly to the API
async function handleStatusToggle(row) {
  const nextStatus = row.status === "Active" ? "Suspended" : "Active";
  if (confirm(`Are you sure you want to change ${row.name}'s status to ${nextStatus}?`)) {
    await store.updateUserStatus(row.id, nextStatus);
  }
}

// Drops a user entirely from the live database
async function handleDeleteUser(id) {
  if (confirm("Are you sure you want to permanently delete this user account?")) {
    await store.deleteUserAccount(id);
  }
}
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-dark">User Management</h1>
        <p class="text-sm text-gray-500 mt-1">Manage and view authenticated student accounts registered in the system.</p>
      </div>
      <div class="bg-emerald-100 text-emerald-800 text-sm font-semibold px-4 py-2 rounded-md">
        Total Students: {{ store.state.users.length }}
      </div>
    </div>

    <AdminTable :columns="columns" :rows="store.state.users">
      <template #status="{ row }">
        <StatusBadge :status="row.status" />
      </template>

      <template #actions="{ row }">
        <div class="flex gap-2">
          <button 
            class="text-sm px-3 py-1.5 rounded font-medium transition-colors"
            :class="row.status === 'Active' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'"
            @click="handleStatusToggle(row)"
          >
            {{ row.status === "Active" ? "Suspend" : "Activate" }}
          </button>
          <button 
            class="bg-red-500 hover:bg-red-600 text-white font-medium rounded text-sm px-3 py-1.5 transition-colors" 
            @click="handleDeleteUser(row.id)"
          >
            Delete
          </button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>