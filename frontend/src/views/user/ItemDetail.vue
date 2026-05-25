<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ClaimModal from "../../components/shared/ClaimModal.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";

const route = useRoute();
const store = useStore();
const modalOpen = ref(false);
const item = computed(() => store.state.foundItems.find((entry) => entry.id === route.params.id));

function submitClaim(payload) {
  store.submitClaim(payload);
  modalOpen.value = false;
}
</script>

<template>
  <AppNavbar role="user" />
  <main v-if="item" class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_0.9fr] sm:px-6 lg:px-8">
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
  </main>
</template>
