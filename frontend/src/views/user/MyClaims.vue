<script setup>
import { onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue"; 
import { Clock, CheckCircle, XCircle, Inbox } from "lucide-vue-next";

const store = useStore();
const isLoading = ref(false);
const fetchError = ref("");

// 🚀 RUN FETCH AUTOMATICALLY WHEN PAGE LOADS
onMounted(async () => {
  try {
    isLoading.value = true;
    fetchError.value = "";
    await store.fetchMyClaims();
  } catch (err) {
    fetchError.value = "Unable to sync your filed claims.";
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
      <h1 class="text-4xl font-bold">My Filed Claims</h1>
      <p class="mt-2 text-white/80">Track the approval state of ownership verification requests.</p>
    </section>

    <div v-if="isLoading" class="text-center py-12 bg-white rounded border shadow-soft">
      <p class="text-muted animate-pulse font-medium">Loading your filed claims...</p>
    </div>

    <div v-else-if="fetchError" class="p-4 bg-danger/10 text-danger border border-danger/20 rounded text-center">
      {{ fetchError }}
    </div>

    <div v-else-if="store.state.claims.length === 0" class="text-center py-12 bg-white rounded border shadow-soft">
      <Inbox class="h-12 w-12 mx-auto text-primary mb-2" />
      <h3 class="font-bold text-dark text-xl">No claims filed yet</h3>
      <p class="text-sm text-muted mt-1">When you submit a claim request for an item, it will appear here.</p>
    </div>

    <div v-else class="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
      <div v-for="claim in store.state.claims" :key="claim.id" class="p-6 bg-white rounded-md border shadow-soft flex flex-col justify-between gap-4">
        <div class="space-y-2">
          <div class="flex justify-between items-start gap-2">
            <h3 class="font-bold text-xl text-dark">{{ claim.itemName }}</h3>
            <span class="text-xs font-bold px-2.5 py-1 rounded border" :class="{
              'bg-amber-50 text-amber-700 border-amber-200': claim.status === 'Pending',
              'bg-green-50 text-green-700 border-green-200': claim.status === 'Approved',
              'bg-red-50 text-red-700 border-red-200': claim.status === 'Rejected'
            }">{{ claim.status }}</span>
          </div>
          <p class="text-xs text-muted">Submitted on: <span class="font-semibold text-dark">{{ claim.date }}</span></p>
          <div class="mt-3 text-sm bg-light p-3 rounded border">
            <span class="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Your Submitted Proof:</span>
            <p class="italic text-muted">"{{ claim.proof }}"</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>