<script setup>
import { ref, onMounted, computed } from "vue";
import { Loader2 } from "lucide-vue-next";
import AdminTable from "../../components/shared/AdminTable.vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";
import { api } from "../../services/api";

const store = useStore();

const users = ref([]);
const loading = ref(true);
const error = ref("");
const actionLoading = ref(null);

const columns = [
  { key: "name", label: "Name" },
  { key: "school_id", label: "School ID" },
  { key: "email", label: "Email" },
  { key: "reportsCount", label: "Reports" },
  { key: "status", label: "Status" },
  { key: "joinDate", label: "Joined" }
];

onMounted(async () => {
  await loadUsers();
});

async function loadUsers() {
  loading.value = true;
  error.value = "";
  try {
    users.value = await api.get("/admin/users");
  } catch (err) {
    error.value = err.message || "Failed to load users.";
  } finally {
    loading.value = false;
  }
}

function reportsCount(user) {
  return (
    store.state.lostReports.filter((r) => r.ownerEmail === user.email).length +
    store.state.foundReports.filter((r) => r.ownerEmail === user.email).length
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

const tableRows = computed(() =>
  users.value.map((u) => ({
    ...u,
    reportsCount: reportsCount(u),
    joinDate: formatDate(u.created_at)
  }))
);

async function toggleSuspend(user) {
  actionLoading.value = user.id + "-suspend";
  const newStatus = user.status === "Suspended" ? "Active" : "Suspended";
  try {
    const res = await api.patch(`/admin/users/${user.id}`, { status: newStatus });
    const index = users.value.findIndex((u) => u.id === user.id);
    if (index >= 0) users.value[index] = { ...users.value[index], status: res.user.status };
  } catch (err) {
    alert(err.message || "Failed to update user status.");
  } finally {
    actionLoading.value = null;
  }
}

async function deleteUser(user) {
  if (!confirm(`Delete account for ${user.name}? This cannot be undone.`)) return;
  actionLoading.value = user.id + "-delete";
  try {
    await api.delete(`/admin/users/${user.id}`);
    users.value = users.value.filter((u) => u.id !== user.id);
  } catch (err) {
    alert(err.message || "Failed to delete user.");
  } finally {
    actionLoading.value = null;
  }
}
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-dark">User Management</h1>
      <span class="text-sm text-muted">{{ users.length }} registered student{{ users.length !== 1 ? "s" : "" }}</span>
    </div>

    <div v-if="loading" class="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 class="h-5 w-5 animate-spin" />
      <span>Loading users…</span>
    </div>

    <div v-else-if="error" class="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger">
      {{ error }}
      <button class="ml-3 font-semibold underline" @click="loadUsers">Retry</button>
    </div>

    <AdminTable v-else :columns="columns" :rows="tableRows">
      <template #reportsCount="{ row }">{{ row.reportsCount }}</template>

      <template #status="{ row }">
        <StatusBadge :status="row.status || 'Active'" />
      </template>

      <template #actions="{ row }">
        <div class="flex gap-2">
          <button
            class="btn-secondary px-3 py-1.5 disabled:opacity-50"
            :disabled="actionLoading === row.id + '-suspend'"
            @click="toggleSuspend(row)"
          >
            <Loader2 v-if="actionLoading === row.id + '-suspend'" class="h-3.5 w-3.5 animate-spin" />
            <span v-else>{{ row.status === "Suspended" ? "Unsuspend" : "Suspend" }}</span>
          </button>
          <button
            class="btn-danger px-3 py-1.5 disabled:opacity-50"
            :disabled="actionLoading === row.id + '-delete'"
            @click="deleteUser(row)"
          >
            <Loader2 v-if="actionLoading === row.id + '-delete'" class="h-3.5 w-3.5 animate-spin" />
            <span v-else>Delete</span>
          </button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>
