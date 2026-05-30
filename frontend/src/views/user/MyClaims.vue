<script setup>
import { onMounted, ref } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue"; 
import { useStore } from "../../composables/useStore";
import { Clock, CheckCircle, XCircle, Inbox } from "lucide-vue-next";

const store = useStore();
const isLoading = ref(false);
const fetchError = ref("");

onMounted(async () => {
  try {
    isLoading.value = true;
    fetchError.value = "";
    await store.fetchMyClaims();
  } catch (err) {
    fetchError.value = "Unable to sync your claims from the database.";
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
      <p class="mt-2 text-white/80">Track the approval state of items you have requested verification for.</p>
    </section>

    <div v-if="isLoading" class="text-center py-12 bg-white rounded border shadow-soft">
      <p class="text-muted animate-pulse font-medium">Loading your filed claims...</p>
    </div>

    <div v-else-if="fetchError" class="p-4 bg-danger/10 text-danger border border-danger/20 rounded text-center">
      {{ fetchError }}
    </div>

    <div v-else-if="store.state.claims.length === 0" class="text-center py-12 bg-white rounded border shadow-soft">
      <Inbox class="h-12 w-12 mx-auto text-primary mb-2" />
      <h3 class="font-bold text-dark text-xl">No claims found</h3>
      <p class="text-sm text-muted mt-1">When you submit a claim request for a found item, it will appear right here.</p>
    </div>

    <div v-else class="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
      <div v-for="claim in store.state.claims" :key="claim.id" class="p-6 bg-white rounded-md border shadow-soft flex flex-col justify-between gap-4">
        <div class="space-y-2">
          <div class="flex justify-between items-start gap-2">
            <h3 class="font-bold text-xl text-dark">{{ claim.itemName }}</h3>
            <span v-if="claim.status === 'Pending'" class="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded">
              <Clock class="h-3.5 w-3.5" /> Pending
            </span>
            <span v-else-if="claim.status === 'Approved'" class="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 rounded">
              <CheckCircle class="h-3.5 w-3.5" /> Approved
            </span>
            <span v-else class="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-1 rounded">
              <XCircle class="h-3.5 w-3.5" /> Rejected
            </span>
          </div>
          <p class="text-xs text-muted">Submitted on: <span class="font-semibold text-dark">{{ claim.date }}</span></p>
          <div class="mt-3 text-sm bg-light p-3 rounded border">
            <span class="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Your Claim Description / Proof:</span>
            <p class="italic text-muted">"{{ claim.proof }}"</p>
          </div>
          <div v-if="claim.note" class="mt-2 text-sm bg-amber-50/50 p-3 rounded border border-amber-200/60">
            <span class="text-xs font-bold text-amber-800 block mb-1 uppercase tracking-wider">Office Management Feedback:</span>
            <p class="text-dark">{{ claim.note }}</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>