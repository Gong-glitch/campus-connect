<script setup>
import { computed, onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore"; // Fixed to use direct relative paths

// 🚀 Fixed: Explicitly relative paths that work perfectly on Linux production builds
import AppNavbar from "../../components/shared/AppNavbar.vue";
import AdminTable from "../../components/shared/AdminTable.vue";
import ClaimModal from "../../components/shared/ClaimModal.vue";

const store = useStore();
const { state } = store;

const selectedClaim = ref(null);
const isModalOpen = ref(false);

const claimsHeaders = [
  { key: "id", label: "Claim ID" },
  { key: "itemName", label: "Item Name" },
  { key: "claimerName", label: "Claimer" },
  { key: "date", label: "Date Submitted" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" }
];

const mappedClaims = computed(() => {
  return state.claims.map((claim) => {
    const relatedItem = state.foundItems.find((item) => item.id === claim.itemId);
    return {
      ...claim,
      itemName: relatedItem ? relatedItem.title : `Unknown Item (#${claim.itemId})`
    };
  });
});

function openReviewModal(claim) {
  selectedClaim.value = claim;
  isModalOpen.value = true;
}

function handleStatusUpdate({ claimId, status }) {
  store.updateClaimStatus(claimId, status);
  isModalOpen.value = false;
  selectedClaim.value = null;
}

onMounted(() => {
  store.fetchClaims();
  if (state.foundItems.length === 0) {
    store.fetchItems();
  }
});
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-3xl font-bold text-dark">Review Claims</h1>
        <p class="mt-1 text-sm text-gray-500">
          Verify ownership descriptions and process pending claim requests.
        </p>
      </div>
    </div>

    <div class="rounded-md bg-white shadow-soft">
      <AdminTable :headers="claimsHeaders" :items="mappedClaims">
        <template #cell(status)="{ item }">
          <span
            class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
            :class="{
              'bg-yellow-100 text-yellow-800': item.status === 'Pending',
              'bg-green-100 text-green-800': item.status === 'Approved',
              'bg-red-100 text-red-800': item.status === 'Rejected'
            }"
          >
            {{ item.status }}
          </span>
        </template>

        <template #cell(actions)="{ item }">
          <button
            v-if="item.status === 'Pending'"
            @click="openReviewModal(item)"
            class="text-sm font-medium text-primary hover:text-indigo-900"
          >
            Review Claim
          </button>
          <span v-else class="text-sm text-gray-400">Processed</span>
        </template>
      </AdminTable>
    </div>

    <ClaimModal
      :isOpen="isModalOpen"
      :claim="selectedClaim"
      @close="isModalOpen = false"
      @update-status="handleStatusUpdate"
    />
  </main>
</template>