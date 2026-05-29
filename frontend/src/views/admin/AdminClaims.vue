<script setup>
import { computed, onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import AdminTable from "../../components/shared/AdminTable.vue";
// 🛠️ IMPORT FIXED: Added missing StatusBadge import so styles render correctly
import StatusBadge from "../../components/shared/StatusBadge.vue";

const store = useStore();
const rejecting = ref(null);
const selectedClaim = ref(null); // Tracks which claim's details/image we show at the bottom
const note = ref("");

const columns = [
  { key: "claimantName", label: "Claimant Name" },
  { key: "schoolId",     label: "School ID" },
  { key: "itemName",     label: "Item Claimed" },
  { key: "proof",        label: "Proof Description" },
  { key: "date",         label: "Date" },
  { key: "status",       label: "Status" }
];

// Triggers the store action to refresh all active claims records when entering page
onMounted(() => {
  if (store.fetchClaims) {
    store.fetchClaims();
  }
});

function reject() {
  store.updateClaim(rejecting.value.id, "Rejected", note.value);
  rejecting.value = null;
  note.value = "";
  selectedClaim.value = null;
}

function handleApprove(row) {
  store.updateClaim(row.id, "Approved");
  selectedClaim.value = null;
}
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">Claims Management</h1>
    
    <AdminTable :columns="columns" :rows="store.state.claims">
      <template #proof="{ row }">
        <span class="block max-w-xs truncate">{{ row.proof }}</span>
      </template>
      
      <template #status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      
      <template #actions="{ row }">
        <div class="flex gap-2">
          <button class="btn-secondary px-3 py-1.5" @click="selectedClaim = row">View</button>
          <button class="btn-primary px-3 py-1.5" @click="handleApprove(row)">Approve</button>
          <button class="btn-danger px-3 py-1.5" @click="rejecting = row">Reject</button>
        </div>
      </template>
    </AdminTable>

    <div v-if="selectedClaim" class="rounded-md border border-gray-200 bg-white p-6 shadow-soft mt-6">
      <div class="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 class="text-xl font-bold text-dark">Verification Details for {{ selectedClaim.itemName }}</h2>
        <button class="text-sm text-muted hover:text-dark font-medium" @click="selectedClaim = null">✕ Hide Details</button>
      </div>

      <div class="mt-4 grid gap-6 md:grid-cols-2">
        <div class="space-y-3 text-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">Claimant Details</p>
            <p class="mt-1 font-medium text-dark">{{ selectedClaim.claimantName }} (ID: {{ selectedClaim.schoolId }})</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">Proof statement description</p>
            <p class="mt-1 rounded-md bg-light px-3 py-2 text-dark whitespace-pre-wrap">{{ selectedClaim.proof }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">Current Decision Status</p>
            <div class="mt-1"><StatusBadge :status="selectedClaim.status" /></div>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Uploaded Proof Document / Image</p>
          <div class="overflow-hidden rounded-md border border-gray-200 bg-light flex items-center justify-center p-2">
            <img 
              v-if="selectedClaim.proof_image || selectedClaim.image_path || selectedClaim.photo || selectedClaim.image" 
              :src="selectedClaim.proof_image || selectedClaim.image_path || selectedClaim.photo || selectedClaim.image" 
              alt="Verification asset source proof document link" 
              class="max-h-64 object-contain rounded"
            />
            <div v-else class="text-center py-12 text-muted">
              <p class="text-sm">No documentation proof image uploaded for this claim file.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rejecting" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form class="w-full max-w-md rounded-md bg-white p-6 shadow-soft" @submit.prevent="reject">
        <h2 class="text-xl font-bold text-dark">Rejection Note</h2>
        <textarea v-model="note" class="field mt-4 min-h-28" placeholder="Explain why the claim was rejected" required />
        <div class="mt-5 flex justify-end gap-2">
          <button class="btn-secondary" type="button" @click="rejecting = null">Cancel</button>
          <button class="btn-danger">Reject Claim</button>
        </div>
      </form>
    </div>
  </main>
</template>