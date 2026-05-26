<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ClaimModal from "../../components/shared/ClaimModal.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";

const route = useRoute();
const store = useStore();
const modalOpen = ref(false);
const item = ref(null);
const error = ref("");

onMounted(async () => {
  try {
    item.value = await store.fetchItem(route.params.id);
  } catch (_) {
    error.value = "Item not found or could not be loaded.";
  }
});

function submitClaim(payload) {
  store.submitClaim(payload);
  modalOpen.value = false;
}
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <p v-if="error" class="text-center text-muted">{{ error }}</p>
    <div v-else-if="!item" class="py-16 text-center text-muted">Loading…</div>
    <div v-else class="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <img :src="item.photo" :alt="item.name" class="h-full min-h-96 w-full rounded-md object-cover shadow-soft" />
      <section class="rounded-md bg-white p-6 shadow-soft">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-primary">{{ item.category }}</p>
            <h1 class="mt-1 text-3xl font-bold text-dark">{{ item.name }}</h1>
          </div>
          <StatusBadge :status="item.status" />
        </div>
        <p class="mt-5 text-muted">{{ item.description }}</p>
        <dl class="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt class="label">Location</dt><dd>{{ item.location }}</dd></div>
          <div><dt class="label">Date Found</dt><dd>{{ item.date }}</dd></div>
        </dl>
        <button class="btn-primary mt-8 w-full" type="button" @click="modalOpen = true">Claim This Item</button>
      </section>
      <ClaimModal :open="modalOpen" :item="item" @close="modalOpen = false" @submit="submitClaim" />
    </div>
  </main>
</template>
