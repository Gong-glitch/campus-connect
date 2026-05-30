<script setup>
import { computed, onMounted, ref } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue"; 
import { useStore } from "../../composables/useStore";
import { Clock, CheckCircle, XCircle, Inbox } from "lucide-vue-next";

const store = useStore();
const { state } = store;
const isLoading = ref(false);

// Triggers data fetch on page load
onMounted(async () => {
  isLoading.value = true;
  try {
    if (store.fetchMyClaims) {
      await store.fetchMyClaims();
    }
  } catch (error) {
    console.error("Failed to fetch claims:", error);
  } finally {
    isLoading.value = false;
  }
});

// The backend already filters your claims securely, so we just display them all here
const myClaims = computed(() => {
  return state.claims || [];
});
</script>

<template>
  <AppNavbar role="user" />

  <main class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    
    <section class="rounded-md bg-gradient-to-r from-primary to-secondary p-8 text-white shadow-soft">
      <h1 class="max-w-3xl text-4xl font-bold">My Filed Claims</h1>
      <p class="mt-3 max-w-2xl text-white/85">
        Track the live verification and approval status of your ownership requests.
      </p>
    </section>

    <div v-if="isLoading" class="text-center py-12 bg-white rounded-md border shadow-soft animate-pulse text-muted font-medium">
      Fetching your submitted claims from the database...
    </div>

    <div v-else-if="myClaims.length === 0" class="text-center py-12 rounded-md border bg-white shadow-soft">
      <Inbox class="h-12 w-12 mx-auto text-primary mb-2" />
      <h3 class="font-bold text-dark text-xl">No claims filed yet</h3>
      <p class="text-sm text-muted mt-1">When you request a found item from the browser, it will appear here.</p>
    </div>

    <div v-else class="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
      <div 
        v-for="claim in myClaims" 
        :key="claim.id" 
        class="p-6 bg-white rounded-md shadow-soft border flex flex-col justify-between gap-4 transition hover:-translate-y-0.5"
      >
        <div class="space-y-2">
          <div class="flex justify-between items-start gap-2">
            <h3 class="font-bold text-xl text-dark">{{ claim.itemName }}</h3>
            
            <span v-if="claim.status === 'Pending'" class="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-md">
              <Clock class="h-3.5 w-3.5" /> Pending
            </span>
            <span v-else-if="claim.status === 'Approved'" class="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-md">
              <CheckCircle class="h-3.5 w-3.5" /> Approved
            </span>
            <span v-else class="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1 rounded-md">
              <XCircle class="h-3.5 w-3.5" /> Rejected
            </span>
          </div>

          <p class="text-xs text-muted">Submitted Date: <span class="font-semibold">{{ claim.date }}</span></p>
          
          <div class="mt-3 text-sm bg-light p-3 rounded-md border text-dark">
            <span class="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Your Submitted Proof:</span>
            <p class="italic text-muted">"{{ claim.proof }}"</p>
          </div>

          <div v-if="claim.note" class="mt-2 text-sm bg-primary/5 p-3 rounded-md border border-primary/10 text-dark">
            <span class="text-xs font-bold text-secondary block mb-1 uppercase tracking-wider">Office Notes:</span>
            <p class="font-medium text-dark">{{ claim.note }}</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>