<script setup>
import { onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import AdminTable from "../../components/shared/AdminTable.vue";

const store = useStore();
const isLoading = ref(false);
const fetchError = ref("");

// 🚀 CALL THE STORE ONCE THE COMPONENT MOUNTS
onMounted(async () => {
  try {
    isLoading.value = true;
    fetchError.value = "";
    if (store.fetchUsers) {
      await store.fetchUsers();
    } else {
      console.error("The function 'fetchUsers' is missing from your store!");
    }
  } catch (err) {
    fetchError.value = "Failed to load registered student profiles.";
    console.error("Network Fetch Error:", err);
  } finally {
    isLoading.value = false;
  }
});

const columns = [
  { key: "name",        label: "Full Name" },
  { key: "schoolId",    label: "School ID" },
  { key: "email",       label: "School Email" },
  { key: "date",        label: "Join Date" },
  { key: "status",      label: "System Status" }
];

async function handleToggleStatus(user) {
  const nextStatus = user.status === "Active" ? "Banned" : "Active";
  if (confirm(`Are you sure you want to change this user status to ${nextStatus}?`)) {
    try {
      await store.updateUserStatus(user.id, nextStatus);
      await store.fetchUsers(); 
    } catch (err) {
      console.error(err);
    }
  }
}

async function handleDeleteUser(id) {
  if (confirm("Are you sure you want to permanently delete this student account?")) {
    try {
      await store.deleteUserAccount(id);
      await store.fetchUsers(); 
    } catch (err) {
      console.error(err);
    }
  }
}
</script>

<template>
  <AppNavbar role="admin" />

  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between border-b pb-3">
      <div>
        <h1 class="text-3xl font-bold text-dark">User Management</h1>
        <p class="text-sm text-muted mt-0.5">Manage and view authenticated student accounts registered in the system.</p>
      </div>

      <div class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-md font-bold text-sm shadow-sm">
        Total Students: <span class="text-base text-primary pl-1">{{ store.state.users?.length || 0 }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12 bg-white rounded-md border shadow-soft animate-pulse font-medium text-muted">
      Fetching student accounts over network pipeline...
    </div>

    <div v-else-if="fetchError" class="p-4 bg-danger/10 text-danger border border-danger/20 rounded-md text-sm font-medium text-center">
      {{ fetchError }}
    </div>

    <AdminTable v-else :columns="columns" :rows="store.state.users || []">
      <template #status="{ row }">
        <span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded" :class="{
          'bg-green-50 text-green-700 border border-green-200': row.status === 'Active',
          'bg-red-50 text-red-700 border border-red-200': row.status !== 'Active'
        }">
          {{ row.status || 'Active' }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-2">
          <button 
            class="text-xs font-semibold px-3 py-1.5 rounded transition-colors border"
            :class="row.status === 'Active' ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'"
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 'Active' ? 'Suspend' : 'Activate' }}
          </button>

          <button 
            class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
            @click="handleDeleteUser(row.id)"
          >
            Delete
          </button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>