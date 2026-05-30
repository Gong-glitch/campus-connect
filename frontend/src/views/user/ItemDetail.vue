<script setup>
import { ref, onMounted, computed } from "vue";
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

// 🖼️ DYNAMIC IMAGE CLEANING PIPELINE
// Translates raw database paths to your live Render server image stream!
const cleanPhotoUrl = computed(() => {
  if (!item.value) return null;

  // Try to find the image string under common column keys
  let rawPath = item.value.image_path ?? item.value.photo ?? item.value.image ?? null;
  if (!rawPath) return null;

  // If it's already an absolute HTTP URL, leave it alone
  if (rawPath.startsWith('http')) {
    return rawPath;
  }

  // Trim spaces and strip out leading slashes
  let cleanPath = rawPath.trim().replace(/^\//, '');

  // Strip common storage folder prefixes if present
  if (cleanPath.startsWith('public/storage/')) {
    cleanPath = cleanPath.substring(15);
  } else if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.substring(8);
  } else if (cleanPath.startsWith('app/public/')) {
    cleanPath = cleanPath.substring(11);
  }

  // Format into your exact functional Render streaming utility
  return `https://campus-connect-api-0s3b.onrender.com/api/storage/${cleanPath}`;
});

function submitClaim(payload) {
  store.submitClaim(payload);
  modalOpen.value = false;
}
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <p v-if="error" class="text-center text-danger font-semibold bg-danger/10 border border-danger/20 p-4 rounded">{{ error }}</p>
    <div v-else-if="!item" class="py-16 text-center text-muted">Loading…</div>
    <div v-else class="grid gap-8 lg:grid-cols-[1fr_0.9fr]">

      <div class="h-full min-h-96 w-full rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-soft flex items-center justify-center">
        <img 
          v-if="cleanPhotoUrl"
          :src="cleanPhotoUrl" 
          :alt="item.name || 'Found item image'" 
          class="h-full max-h-[500px] w-full object-contain" 
        />
        <div v-else class="flex flex-col items-center justify-center py-16 text-muted">
          <svg class="h-12 w-12 stroke-[1.5] text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          <p class="mt-2 text-sm">No photo available for this listing</p>
        </div>
      </div>

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
          <div><dt class="label">Location</dt><dd class="text-dark font-medium mt-0.5">{{ item.location }}</dd></div>
          <div><dt class="label">Date Found</dt><dd class="text-dark font-medium mt-0.5">{{ item.date }}</dd></div>
        </dl>
        <button class="btn-primary mt-8 w-full" type="button" @click="modalOpen = true">Claim This Item</button>
      </section>
      <ClaimModal :open="modalOpen" :item="item" @close="modalOpen = false" @submit="submitClaim" />
    </div>
  </main>
</template>