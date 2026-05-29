<script setup>
import { computed, ref, onMounted, inject } from "vue";
import { Loader2 } from "lucide-vue-next";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ConfirmDialog from "../../components/shared/ConfirmDialog.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { appStoreKey } from "../../store/appStore";
import { api } from "../../services/api";

const store = inject(appStoreKey);

const tab = ref("lost");
const loading = ref(true);
const deleting = ref(null);
const deleteLoading = ref(false);

// 🎯 FORCE COMPONENT TO LOOK DIRECTLY AT THE GLOBAL STORE REPOSITORIES
const activeReports = computed(() => {
  return tab.value === "lost" 
    ? store.state.lostReports 
    : store.state.foundReports;
});

// Leverage global store actions to load data cleanly
async function loadDashboardData() {
  loading.value = true;
  try {
    if (store && typeof store.fetchMyReports === "function") {
      // Calls the /my-lost-reports and /my-found-reports endpoints
      await store.fetchMyReports();
    }
  } catch (err) {
    console.error("Dashboard engine query error:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboardData();
});

async function remove() {
  deleteLoading.value = true;
  try {
    const type = tab.value;
    const id = deleting.value.id;
    const endpoint = type === "lost" ? `/lost-reports/${id}` : `/items/${id}`;
    await api.delete(endpoint);
    deleting.value = null;
    await loadDashboardData();
  } catch (err) {
    alert(err.message || "Failed to delete report.");
  } finally {
    deleteLoading.value = false;
  }
}
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">My Reports</h1>

    <div class="mt-5 flex gap-2 rounded-md bg-white p-2 shadow-soft">
      <button 
        class="flex-1 rounded-md px-4 py-2 font-semibold transition" 
        :class="tab === 'lost' ? 'bg-primary text-white' : 'text-muted'" 
        @click="tab = 'lost'"
      >
        My Lost Reports
      </button>
      <button 
        class="flex-1 rounded-md px-4 py-2 font-semibold transition" 
        :class="tab === 'found' ? 'bg-primary text-white' : 'text-muted'" 
        @click="tab = 'found'"
      >
        My Found Reports
      </button>
    </div>

    <div v-if="loading" class="mt-12 flex justify-center items-center">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <div v-else class="mt-6 grid gap-4">
      <article v-for="report in activeReports" :key="report.id" class="rounded-md bg-white p-5 shadow-soft">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <img 
              v-if="report.photo" 
              :src="report.photo" 
              alt="Report image" 
              class="h-16 w-16 rounded-md object-cover bg-gray-100"
              @error="(e) => e.target.src = 'https://placehold.co/150?text=No+Image'"
            />
            <div>
              <h2 class="text-xl font-bold text-dark">{{ report.name || "Unnamed Item" }}</h2>
              <p class="text-sm text-muted">
                {{ report.date || "No Date" }} / {{ report.location || "Unknown Location" }}
              </p>
            </div>
          </div>
          <StatusBadge :status="report.status" />
        </div>
        <p class="mt-3 text-sm text-muted">{{ report.description }}</p>
        <div class="mt-4 flex gap-2">
          <button class="btn-danger" @click="deleting = report">Delete</button>
        </div>
      </article>

      <p v-if="!activeReports || !activeReports.length" class="rounded-md bg-white p-8 text-center text-muted shadow-soft">
        No reports yet.
      </p>
    </div>

    <ConfirmDialog
      :open="Boolean(deleting)"
      :loading="deleteLoading"
      title="Delete report"
      message="This report will be permanently removed."
      @cancel="deleting = null"
      @confirm="remove"
    />
  </main>
</template>