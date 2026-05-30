<script setup>
import { onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import AdminTable from "../../components/shared/AdminTable.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";

const store = useStore();
const rejecting = ref(null);
const note = ref("");
const isLoading = ref(false);

onMounted(async () => {
  try {
    isLoading.value = true;
    await store.fetchAdminClaims();
  } catch (err) {
    console.error("Admin dashboard network failure processing mapping logs:", err);
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
  if (confirm("Approve claim request and mark item as resolved across database?")) {
    await store.updateClaim(id, "Approved");
  }
}

async function rejectSubmit() {
  await store.updateClaim(rejecting.value.id, "Rejected", note.value);
  rejecting.value = null;
  note.value = "";
}

async function deleteRow(id) {
  if (confirm("Permanently drop this log entry tracking record?")) {
    await store.deleteClaim(id);
  }
}
</script>

<template>
  <AppNavbar role="admin" />

  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between border-b pb-3">
      <h1 class="text-3xl font-bold text-dark">Claims Management Panel</h1>
      <span v-if="isLoading" class="text-xs bg-primary/10 text-primary animate-pulse px-3 py-1 rounded font-medium">
        Syncing Global Records...
      </span>
    </div>

    <AdminTable :columns="columns" :rows="store.state.claims">
      <template #proof="{ row }">
        <span class="block max-w-xs truncate text-xs bg-light border px-2 py-1 rounded font-mono text-dark" :title="row.proof">
          {{ row.proof }}
        </span>
      </template>

      <template #status="{ row }">
        <StatusBadge :status="row.status" />
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1.5">
          <button 
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-xs px-2.5 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="row.status !== 'Pending'" 
            @click="approve(row.id)"
          >
            Approve
          </button>
          <button 
            class="bg-rose-600 hover:bg-rose-700 text-white font-medium rounded text-xs px-2.5 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="row.status !== 'Pending'" 
            @click="rejecting = row"
          >
            Reject
          </button>
          <button 
            class="bg-slate-500 hover:bg-slate-600 text-white font-medium rounded text-xs px-2.5 py-1.5 transition-colors" 
            @click="deleteRow(row.id)"
          >
            Delete
          </button>
        </div>
      </template>
    </AdminTable>

    <div v-if="rejecting" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
      <form class="w-full max-w-md rounded-md bg-white p-6 shadow-xl border flex flex-col gap-3" @submit.prevent="rejectSubmit">
        <h2 class="text-xl font-bold text-dark">Rejection Processing</h2>
        <p class="text-xs text-muted">Item: <span class="font-bold text-dark">{{ rejecting.itemName }}</span> | Claimant: <span class="font-bold text-dark">{{ rejecting.claimantName }}</span></p>

        <textarea v-model="note" class="field min-h-24 text-sm mt-1" placeholder="Type reason explaining why this verification failed matching properties..." required />

        <div class="flex justify-end gap-2 mt-2">
          <button class="btn-secondary text-xs" type="button" @click="rejecting = null">Cancel</button>
          <button class="bg-rose-600 text-white font-semibold text-xs px-4 py-2 rounded shadow hover:bg-rose-700" type="submit">Confirm Rejection</button>
        </div>
      </form>
    </div>
  </main>
</template>