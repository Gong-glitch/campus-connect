<script setup>
import { onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import { ShieldAlert, CheckCircle, Clock, Inbox } from "lucide-vue-next";

const store = useStore();
const { state } = store;

const isLoading = ref(false);
const fetchError = ref("");

// 🚀 MANDATORY TRIGGER: This pulls your live backend data arrays when the page loads!
onMounted(async () => {
  try {
    isLoading.value = true;
    fetchError.value = "";
    // Pulls data from /api/my-lost-reports and /api/my-found-reports simultaneously
    await store.fetchMyReports();
  } catch (err) {
    fetchError.value = "Failed to synchronize your recorded reports from the server.";
    console.error(err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <AppNavbar role="user" />

  <main class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

    <section class="rounded-md bg-gradient-to-r from-primary to-secondary p-8 text-white shadow-soft">
      <h1 class="text-4xl font-bold">My Filed Reports</h1>
      <p class="mt-2 text-white/85">View and monitor items you have personally reported as lost or found on campus.</p>
    </section>

    <div v-if="isLoading" class="text-center py-12 bg-white rounded border">
      <p class="text-muted animate-pulse font-medium">Fetching your items from the registry...</p>
    </div>

    <div v-else-if="fetchError" class="p-4 bg-danger/10 text-danger border border-danger/20 rounded text-center text-sm">
      {{ fetchError }}
    </div>

    <div v-else class="grid gap-8 md:grid-cols-2">

      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-dark border-b pb-2">My Lost Reports</h2>

        <div v-if="state.lostReports.length === 0" class="p-8 text-center bg-white rounded border border-dashed text-sm text-muted">
          <Inbox class="h-8 w-8 mx-auto text-gray-400 mb-2" />
          You haven't posted any lost item reports yet.
        </div>

        <div v-else class="space-y-3">
          <div v-for="report in state.lostReports" :key="report.id" class="p-5 bg-white rounded border shadow-soft flex gap-4">
            <img v-if="report.photo" :src="report.photo" class="w-20 h-20 object-cover rounded border bg-light flex-shrink-0" />
            <div class="flex-1 space-y-1">
              <div class="flex justify-between items-start">
                <h4 class="font-bold text-dark text-lg">{{ report.name }}</h4>
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {{ report.status }}
                </span>
              </div>
              <p class="text-xs text-muted">Location: <strong>{{ report.location }}</strong> | Date: {{ report.date }}</p>
              <p class="text-sm text-dark/80 line-clamp-2 mt-1">{{ report.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-dark border-b pb-2">My Found Reports</h2>

        <div v-if="state.foundReports.length === 0" class="p-8 text-center bg-white rounded border border-dashed text-sm text-muted">
          <Inbox class="h-8 w-8 mx-auto text-gray-400 mb-2" />
          You haven't posted any found item notifications yet.
        </div>

        <div v-else class="space-y-3">
          <div v-for="report in state.foundReports" :key="report.id" class="p-5 bg-white rounded border shadow-soft flex gap-4">
            <img v-if="report.photo" :src="report.photo" class="w-20 h-20 object-cover rounded border bg-light flex-shrink-0" />
            <div class="flex-1 space-y-1">
              <div class="flex justify-between items-start">
                <h4 class="font-bold text-dark text-lg">{{ report.name }}</h4>
                <span class="text-xs font-bold px-2 py-0.5 rounded" :class="{
                  'bg-amber-50 text-amber-700 border border-amber-200': report.status === 'Pending Approval',
                  'bg-emerald-50 text-emerald-700 border border-emerald-200': report.status === 'Unclaimed' || report.status === 'Resolved'
                }">
                  {{ report.status }}
                </span>
              </div>
              <p class="text-xs text-muted">Location: <strong>{{ report.location }}</strong> | Date: {{ report.date }}</p>
              <p class="text-sm text-dark/80 line-clamp-2 mt-1">{{ report.description }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>