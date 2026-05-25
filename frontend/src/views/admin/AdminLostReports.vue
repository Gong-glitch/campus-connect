<script setup>
import AdminTable from "../../components/shared/AdminTable.vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
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
          <button class="btn-secondary px-3 py-1.5" @click="alert(row.description)">View</button>
          <button class="btn-secondary px-3 py-1.5" @click="store.updateReport('lost', row.id, { status: 'Matched' })">Flag as Matched</button>
          <button class="btn-secondary px-3 py-1.5" @click="store.updateReport('lost', row.id, { status: 'Archived' })">Archive</button>
          <button class="btn-danger px-3 py-1.5" @click="store.deleteReport('lost', row.id)">Delete</button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>
