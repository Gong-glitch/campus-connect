<script setup>
import { computed, onMounted, ref } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue"; 
import { useStore } from "../../composables/useStore";
import { Clock, CheckCircle, XCircle, Inbox } from "lucide-vue-next";

const store = useStore();
const { state } = store;

const isLoading = ref(false);
const fetchError = ref("");

onMounted(async () => {
  try {
    isLoading.value = true;
    fetchError.value = "";
    // Pull claims alongside report records simultaneously
    await Promise.all([
      store.fetchMyClaims(),
      store.fetchMyReports()
    ]);
  } catch (err) {
    fetchError.value = "Unable to sync student historical activity feeds.";
    console.error(err);
  } finally {
    isLoading.value = false;
  }
});

// Safe Loose String Normalization Map Check
const clearedClaims = computed(() => {
  const currentUserId = state.session?.id;
  const allClaims = state.claims || [];
  if (allClaims.length === 0) return [];

  return allClaims.filter(claim => {
    if (!claim.user_id) return true; // Fallback display if missing relation field
    return String(claim.user_id) === String(currentUserId);
  });
});
</script>

<template>
  <AppNavbar role="user" />

  <main class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <section class="rounded-md bg-gradient-to-r from-primary to-secondary p-8 text-white shadow-soft">
      <h1 class="text-4xl font-bold">My Personal History Dashboard</h1>
      <p class="mt-2 text-white/80">Track everything you have submitted to the campus lost and found center.</p>
    </section>

    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-dark border-b pb-2">My Property Claims</h2>

      <div v-if="isLoading" class="text-center py-6 bg-white rounded border animate-pulse">
        <p class="text-sm font-medium text-muted">Syncing claims log...</p>
      </div>

      <div v-else-if="clearedClaims.length === 0" class="text-center py-8 bg-white rounded border border-dashed">
        <p class="text-sm text-muted">No item ownership claims submitted yet.</p>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        <div v-for="claim in clearedClaims" :key="claim.id" class="p-5 bg-white rounded border shadow-soft flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start">
              <h3 class="font-bold text-lg text-dark">{{ claim.itemName }}</h3>
              <span class="text-xs font-bold px-2 py-0.5 rounded border" :class="{
                'bg-amber-50 text-amber-700 border-amber-200': claim.status === 'Pending',
                'bg-green-50 text-green-700 border-green-200': claim.status === 'Approved',
                'bg-red-50 text-red-700 border-red-200': claim.status === 'Rejected'
              }">{{ claim.status }}</span>
            </div>
            <p class="text-xs text-muted mt-1">Date: {{ claim.date }}</p>
            <p class="text-xs bg-light p-2.5 rounded border italic text-muted mt-2">"{{ claim.proof }}"</p>
            <div v-if="claim.note" class="mt-2 text-xs bg-amber-50/60 p-2 rounded border border-amber-200 text-dark">
              <strong>Office Note:</strong> {{ claim.note }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-8 md:grid-cols-2 mt-4">

      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-dark border-b pb-2">My Filed Lost Reports</h2>
        <div v-if="state.lostReports.length === 0" class="p-6 text-center bg-white rounded border border-dashed text-sm text-muted">
          No lost item entries recorded.
        </div>
        <div v-else class="space-y-3">
          <div v-for="report in state.lostReports" :key="report.id" class="p-4 bg-white rounded border shadow-soft">
            <div class="flex justify-between items-center">
              <h4 class="font-bold text-dark">{{ report.name }}</h4>
              <span class="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">{{ report.status }}</span>
            </div>
            <p class="text-xs text-muted mt-1">Location Lost: {{ report.location }} | Date: {{ report.date }}</p>
            <p class="text-sm text-dark/80 mt-1 line-clamp-2">{{ report.description }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-dark border-b pb-2">My Filed Found Reports</h2>
        <div v-if="state.foundReports.length === 0" class="p-6 text-center bg-white rounded border border-dashed text-sm text-muted">
          No found item notifications logged.
        </div>
        <div v-else class="space-y-3">
          <div v-for="report in state.foundReports" :key="report.id" class="p-4 bg-white rounded border shadow-soft">
            <div class="flex justify-between items-center">
              <h4 class="font-bold text-dark">{{ report.name }}</h4>
              <span class="text-xs bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded">{{ report.status }}</span>
            </div>
            <p class="text-xs text-muted mt-1">Location Found: {{ report.location }} | Date: {{ report.date }}</p>
            <p class="text-sm text-dark/80 mt-1 line-clamp-2">{{ report.description }}</p>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>