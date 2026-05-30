<script setup>
import { computed, onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import AdminTable from "../../components/shared/AdminTable.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";

const store = useStore();
const rejecting = ref(null);
const note = ref("");

const isLoading = ref(false);
const fetchError = ref("");

// 🚀 AUTOMATIC API TRIGGER: Fetch system-wide database claims on component layout mount
onMounted(async () => {
  try {
    isLoading.value = true;
    fetchError.value = "";
    await store.fetchAdminClaims();
  } catch (err) {
    fetchError.value = "Failed to synchronize operational claims from the backend infrastructure.";
    console.error("Admin API Fetch Error:", err);
  } finally {
    isLoading.value = false;
  }
});

const columns = [
  { key: "claimantName", label: "Claimant Name" },
  { key: "schoolId",     label: "School ID" },
  { key: "itemName",     label: "Item Claimed" },
  { key: "proof",        label: "Proof" },
  { key: "date",         label: "Date" },
  { key: "status",       label: "Status" }
];

async function handleApproveClaim(id) {
  try {
    await store.updateClaim(id, "Approved");
    // Refresh the local tracking records immediately following update execution
    await store.fetchAdminClaims();
  } catch (err) {
    console.error("Error approving verification row asset:", err);
  }
}

async function reject() {
  try {
    await store.updateClaim(rejecting.value.id, "Rejected", note.value);
    rejecting.value = null;
    note.value = "";
    // Re-pull live application instances following processing cascade completion
    await store.fetchAdminClaims();
  } catch (err) {
    console.error("Error logging system claim rejection states:", err);
  }
}

async function handleDeleteClaim(id) {
  if (confirm("Are you sure you want to permanently delete this claim listing?")) {
    try {
      if (store.deleteClaim) {
        await store.deleteClaim(id);
      } else {
        await store.updateClaim(id, "Deleted");
      }
      // Re-sync states dynamically to handle layout transitions cleanly
      await store.fetchAdminClaims();
    } catch (err) {
      console.error("Error discarding claim entity reference:", err);
    }
  }
}
</script>

<template>
  <AppNavbar role="admin" />

  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-dark">Claims Management</h1>

      <span v-if="isLoading" class="text-xs text-muted animate-pulse font-medium bg-light px-3 py-1 rounded border">
        Refreshing DB Rows...
      </span>
    </div>

    <div v-if="fetchError" class="p-4 bg-danger/10 text-danger rounded text-sm font-medium border border-danger/20 text-center">
      {{ fetchError }}
    </div>

    <AdminTable :columns="columns" :rows="store.state.claims">
      <template #proof="{ row }">
        <span class="block max-w-xs truncate font-mono text-xs text-dark/80 bg-light px-2 py-0.5 rounded border" :title="row.proof">
          {{ row.proof }}
        </span>
      </template>

      <template #status="{ row }">
        <StatusBadge :status="row.status" />
      </template>

      <template #actions="{ row }">
        <div class="flex gap-2">
          <button 
            class="btn-secondary px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed" 
            :disabled="row.status !== 'Pending'"
            @click="handleApproveClaim(row.id)"
          >
            Approve
          </button>

          <button 
            class="btn-danger px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed" 
            :disabled="row.status !== 'Pending'"
            @click="rejecting = row"
          >
            Reject
          </button>

          <button 
            class="bg-gray-500 hover:bg-gray-600 text-white font-medium rounded text-xs px-3 py-1.5 transition-colors" 
            @click="handleDeleteClaim(row.id)"
          >
            Delete
          </button>
        </div>
      </template>
    </AdminTable>

    <div v-if="rejecting" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
      <form class="w-full max-w-md rounded-md bg-white p-6 shadow-soft border" @submit.prevent="reject">
        <h2 class="text-xl font-bold text-dark">Provide Rejection Statement</h2>
        <p class="text-xs text-muted mt-1">Item: <span class="font-bold text-dark">{{ rejecting.itemName }}</span> to student claimant: <span class="font-bold text-dark">{{ rejecting.claimantName }}</span></p>

        <textarea 
          v-model="note" 
          class="field mt-4 min-h-28 text-sm" 
          placeholder="Provide explicit reasons for validation refusal (e.g., incorrect serial signature mismatch)" 
          required 
        />

        <div class="mt-5 flex justify-end gap-2">
          <button class="btn-secondary text-sm" type="button" @click="rejecting = null; note = '';">Cancel</button>
          <button class="btn-danger text-sm" type="submit">Confirm Reject</button>
        </div>
      </form>
    </div>
  </main>
</template>