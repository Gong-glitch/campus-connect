<script setup>
import { ref } from "vue";
import { X } from "lucide-vue-next";
import AdminTable from "../../components/shared/AdminTable.vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
const selected = ref(null);

const columns = [
  { key: "name", label: "Item Name" },
  { key: "category", label: "Category" },
  { key: "location", label: "Last Seen" },
  { key: "date", label: "Date" },
  { key: "contactEmail", label: "Contact" },
  { key: "status", label: "Status" }
];
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">Manage Lost Reports</h1>
    <AdminTable :columns="columns" :rows="store.state.lostReports">
      <template #status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #actions="{ row }">
        <div class="flex gap-2">
          <button class="btn-secondary px-3 py-1.5" @click="selected = row">View</button>
          <button class="btn-secondary px-3 py-1.5" @click="store.updateReport('lost', row.id, { status: 'Matched' })">Flag as Matched</button>
          <button class="btn-secondary px-3 py-1.5" @click="store.updateReport('lost', row.id, { status: 'Archived' })">Archive</button>
          <button class="btn-danger px-3 py-1.5" @click="store.deleteReport('lost', row.id)">Delete</button>
        </div>
      </template>
    </AdminTable>
  </main>

  <!-- Detail modal -->
  <Teleport to="body">
    <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="selected = null">
      <div class="w-full max-w-lg rounded-md bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-green-100 px-5 py-4">
          <h2 class="text-lg font-bold text-dark">Lost Report Details</h2>
          <button class="rounded-md p-1 text-muted hover:bg-light" @click="selected = null"><X class="h-5 w-5" /></button>
        </div>
        <div class="space-y-3 px-5 py-5 text-sm">
          <div class="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p class="label">Item Name</p>
              <p class="mt-0.5 font-medium text-dark">{{ selected.name }}</p>
            </div>
            <div>
              <p class="label">Category</p>
              <p class="mt-0.5 font-medium text-dark">{{ selected.category }}</p>
            </div>
            <div>
              <p class="label">Last Seen Location</p>
              <p class="mt-0.5 font-medium text-dark">{{ selected.location }}</p>
            </div>
            <div>
              <p class="label">Date Lost</p>
              <p class="mt-0.5 font-medium text-dark">{{ selected.date }}</p>
            </div>
            <div>
              <p class="label">Contact Email</p>
              <p class="mt-0.5 font-medium text-dark">{{ selected.contactEmail }}</p>
            </div>
            <div>
              <p class="label">Status</p>
              <StatusBadge :status="selected.status" class="mt-0.5" />
            </div>
          </div>
          <div>
            <p class="label">Description</p>
            <p class="mt-1 whitespace-pre-wrap rounded-md bg-light px-3 py-2 text-dark">{{ selected.description }}</p>
          </div>
        </div>
        <div class="flex justify-end border-t border-green-100 px-5 py-4">
          <button class="btn-secondary" @click="selected = null">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
