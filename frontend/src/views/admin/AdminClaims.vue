<script setup>
import { computed, onMounted, ref } from "vue";
import { useStore } from "../../composables/useStore";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import AdminTable from "../../components/shared/AdminTable.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";

const store = useStore();
const rejecting = ref(null);
const note = ref("");

const columns = [
  { key: "claimantName", label: "Claimant Name" },
  { key: "schoolId",     label: "School ID" },
  { key: "itemName",     label: "Item Claimed" },
  { key: "proof",        label: "Proof" },
  { key: "date",         label: "Date" },
  { key: "status",       label: "Status" }
];

function reject() {
  store.updateClaim(rejecting.value.id, "Rejected", note.value);
  rejecting.value = null;
  note.value = "";
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
          <button class="btn-secondary px-3 py-1.5" @click="store.updateClaim(row.id, 'Approved')">Approve</button>
          <button class="btn-danger px-3 py-1.5" @click="rejecting = row">Reject</button>
        </div>
      </template>
    </AdminTable>

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