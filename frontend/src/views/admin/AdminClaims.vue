<script setup>
import { onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import AdminTable from "../../components/shared/AdminTable.vue";

const store = useStore();
const rejecting = ref(null);
const note = ref("");
const isLoading = ref(false);

// 🚀 TRIGGER THE FETCH WHEN ADMIN OPENS THE PAGE
onMounted(async () => {
  isLoading.value = true;
  try {
    if (store.fetchAdminClaims) {
      await store.fetchAdminClaims();
    }
  } catch (err) {
    console.error("Failed to fetch admin claims:", err);
  } finally {
    isLoading.value = false;
  }
});

const columns = [
  { key: "claimantName", label: "Claimant Name" },
  { key: "schoolId",     label: "School ID" },
  { key: "itemName",     label: "Item Claimed" },
  { key: "proof",        label: "Proof Details" },
  { key: "date",         label: "Logged On" },
  { key: "status",       label: "Status" }
];

async function approve(id) {
  if (confirm("Approve claim request and mark item as resolved?")) {
    await store.updateClaim(id, "Approved");
    await store.fetchAdminClaims(); // Reload table after approval
  }
}

async function rejectSubmit() {
  await store.updateClaim(rejecting.value.id, "Rejected", note.value);
  await store.fetchAdminClaims(); // Reload table after rejection
  rejecting.value = null;
  note.value = "";
}

async function deleteRow(id) {
  if (confirm("Permanently drop this log entry tracking record?")) {
    await store.deleteClaim(id);
    await store.fetchAdminClaims(); // Reload table after deletion
  }
}
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between border-b pb-3">
      <div>
        <h1 class="text-3xl font-bold text-dark">Manage Claims</h1>
        <p class="text-sm text-muted mt-0.5">Review and verify student requests for found items.</p>
      </div>
      <div class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-md font-bold text-sm shadow-sm">
        Total Claims: <span class="text-base text-primary pl-1">{{ store.state.claims?.length || 0 }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12 bg-white rounded-md border shadow-soft animate-pulse font-medium text-muted">
      Querying student claims from database...
    </div>

    <AdminTable v-else :columns="columns" :rows="store.state.claims || []">
      <template #status="{ row }">
        <span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded" :class="{
          'bg-amber-50 text-amber-700 border-amber-200': row.status === 'Pending',
          'bg-green-50 text-green-700 border-green-200': row.status === 'Approved',
          'bg-red-50 text-red-700 border-red-200': row.status === 'Rejected'
        }">
          {{ row.status || 'Pending' }}
        </span>
      </template>

      <template #actions="{ row }">
        <div v-if="row.status === 'Pending'" class="flex gap-2">
          <button @click="approve(row.id)" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded transition-colors border">
            Approve
          </button>
          <button @click="rejecting = row" class="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 text-xs font-semibold px-3 py-1.5 rounded transition-colors border">
            Reject
          </button>
        </div>
        <div v-else class="flex gap-2">
          <button @click="deleteRow(row.id)" class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
            Delete
          </button>
        </div>
      </template>
    </AdminTable>

    <div v-if="rejecting" class="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-md shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-dark mb-4">Reject Claim: {{ rejecting.itemName }}</h3>
        <textarea v-model="note" rows="3" class="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3" placeholder="Provide a reason for rejection (optional)"></textarea>
        <div class="mt-5 flex justify-end gap-3">
          <button @click="rejecting = null" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="rejectSubmit" class="px-4 py-2 text-sm font-medium text-white bg-danger border border-transparent rounded-md hover:bg-danger/90">Confirm Rejection</button>
        </div>
      </div>
    </div>
  </main>
</template>