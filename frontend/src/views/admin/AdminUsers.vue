<script setup>
import { computed, ref, onMounted } from "vue";
import { useStore } from "../../composables/useStore";
import { UserX, CheckCircle } from "lucide-vue-next";
import AppNavbar from "../../components/shared/AppNavbar.vue"; // 🚀 Clean matching Nav Component

const store = useStore();
const { state } = store;
const error = ref("");
const loading = ref(false);

// ✅ Filter local store state users array to list only students/users
const students = computed(() => {
  if (!state.users) return [];
  return state.users.filter(user => user.role === 'user' || user.role === 'student');
});

function fetchUsers() {
  loading.value = true;
  error.value = "";
  try {
    if (store.fetchUsers) {
      store.fetchUsers();
    }
  } catch (err) {
    console.error("Failed to load users:", err);
    error.value = "Failed to synchronize user list.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <AppNavbar role="admin" />

  <main class="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
      <div>
        <h1 class="text-3xl font-bold text-dark">User Management</h1>
        <p class="text-sm text-muted mt-1">Manage and view authenticated student accounts registered in the system.</p>
      </div>
      <div class="bg-primary/10 text-primary px-4 py-2 rounded-md font-semibold text-sm self-start sm:self-center">
        Total Students: {{ students.length }}
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-24">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="error" class="p-4 bg-danger/10 text-danger rounded-md text-sm font-medium flex items-center justify-between">
      <span>{{ error }}</span>
      <button @click="fetchUsers" class="underline hover:text-danger-dark font-semibold">Retry</button>
    </div>

    <div v-else-if="students.length === 0" class="flex flex-col items-center justify-center text-center p-12 bg-white border rounded-md shadow-soft">
      <div class="w-14 h-14 rounded-full bg-light flex items-center justify-center text-muted mb-4 border">
        <UserX class="w-6 h-6" />
      </div>
      <h3 class="text-lg font-bold text-dark">No registered students found</h3>
      <p class="text-sm text-muted max-w-sm mt-1">When students create profiles or submit reporting logs, their records will display here dynamically.</p>
    </div>

    <div v-else class="overflow-x-auto bg-white border border-gray-200 rounded-md shadow-soft">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-light border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-muted">
            <th class="px-6 py-4">Full Name</th>
            <th class="px-6 py-4">School ID</th>
            <th class="px-6 py-4">School Email</th>
            <th class="px-6 py-4">Join Date</th>
            <th class="px-6 py-4 text-center">System Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 text-sm font-medium text-dark">
          <tr v-for="student in students" :key="student.id" class="hover:bg-light/40 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap font-semibold">{{ student.name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-muted font-mono text-xs">{{ student.schoolId || 'N/A' }}</td>
            <td class="px-6 py-4 whitespace-nowrap font-normal">{{ student.email }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-muted text-xs font-normal">{{ student.joinDate || 'Recent' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle class="w-3 h-3" />
                {{ student.status || 'Active' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>