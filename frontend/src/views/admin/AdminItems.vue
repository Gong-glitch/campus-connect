<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import AdminTable from "../../components/shared/AdminTable.vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ConfirmDialog from "../../components/shared/ConfirmDialog.vue";
import ImageUploader from "../../components/shared/ImageUploader.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
const search = ref("");
const modal = ref(false);
const editing = ref(null);
const deleting = ref(null);
const form = reactive({ name: "", category: "Electronics", location: "CCIS Building", date: "", reportedBy: "Admin", status: "Unclaimed", description: "", photo: "" });
const columns = [
  { key: "photo", label: "Photo" },
  { key: "name", label: "Item Name", sortable: true },
  { key: "category", label: "Category" },
  { key: "location", label: "Location" },
  { key: "date", label: "Date" },
  { key: "reportedBy", label: "Reported By" },
  { key: "status", label: "Status" }
];
const rows = computed(() => store.state.foundItems.filter((item) => item.name.toLowerCase().includes(search.value.toLowerCase())));
const pendingRows = computed(() =>
  store.state.foundReports.filter(
    (report) =>
      ["Pending Approval", "Rejected"].includes(report.status) &&
      report.name.toLowerCase().includes(search.value.toLowerCase())
  )
);
const pendingColumns = [
  { key: "name", label: "Report Item", sortable: true },
  { key: "category", label: "Category" },
  { key: "location", label: "Where Found" },
  { key: "date", label: "Date Found" },
  { key: "contactEmail", label: "Contact" },
  { key: "status", label: "Review Status" }
];

onMounted(() => store.fetchItems());

function openAdd() {
  editing.value = null;
  Object.assign(form, { name: "", category: "Electronics", location: "CCIS Building", date: "", reportedBy: "Admin", status: "Unclaimed", description: "", photo: "" });
  modal.value = true;
}
function openEdit(item) {
  editing.value = item.id;
  Object.assign(form, item);
  modal.value = true;
}
function save() {
  const payload = { ...form, photo: form.photo || `https://placehold.co/640x420/e8f5ee/1b6b3a?text=${encodeURIComponent(form.name)}` };
  editing.value ? store.updateFoundItem(editing.value, payload) : store.addFoundItem(payload);
  modal.value = false;
}
function remove() {
  store.deleteFoundItem(deleting.value.id);
  deleting.value = null;
}
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-3xl font-bold text-dark">Manage Found Items</h1>
      <button class="btn-primary" @click="openAdd">+ Add Item</button>
    </div>
    <input v-model="search" class="field max-w-md" placeholder="Search items" />
    <section class="space-y-3">
      <h2 class="text-xl font-bold text-dark">Pending User Reports</h2>
      <AdminTable :columns="pendingColumns" :rows="pendingRows">
        <template #status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #actions="{ row }">
          <div class="flex gap-2">
            <button class="btn-secondary px-3 py-1.5" @click="alert(row.description)">View</button>
            <button class="btn-primary px-3 py-1.5" @click="store.approveFoundReport(row.id)">Approve</button>
            <button class="btn-danger px-3 py-1.5" @click="store.rejectFoundReport(row.id)">Reject</button>
          </div>
        </template>
      </AdminTable>
    </section>
    <section class="space-y-3">
      <h2 class="text-xl font-bold text-dark">Published Found Items</h2>
    <AdminTable :columns="columns" :rows="rows">
      <template #photo="{ row }"><img :src="row.photo" :alt="row.name" class="h-12 w-16 rounded-md object-cover" /></template>
      <template #status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #actions="{ row }">
        <div class="flex gap-2">
          <RouterLink class="btn-secondary px-3 py-1.5" :to="`/items/${row.id}`">View</RouterLink>
          <button class="btn-secondary px-3 py-1.5" @click="openEdit(row)">Edit</button>
          <button class="btn-secondary px-3 py-1.5" @click="store.updateFoundItem(row.id, { status: 'Claimed' })">Mark as Claimed</button>
          <button class="btn-danger px-3 py-1.5" @click="deleting = row">Delete</button>
        </div>
      </template>
    </AdminTable>
    </section>
    <div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white p-6 shadow-soft" @submit.prevent="save">
        <h2 class="text-2xl font-bold text-dark">{{ editing ? "Edit Item" : "Add Item" }}</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <input v-model="form.name" class="field" placeholder="Item Name" required />
          <select v-model="form.category" class="field"><option v-for="category in store.state.settings.categories" :key="category">{{ category }}</option></select>
          <select v-model="form.location" class="field"><option v-for="location in store.state.settings.locations" :key="location">{{ location }}</option></select>
          <input v-model="form.date" class="field" type="date" required />
          <input v-model="form.reportedBy" class="field" placeholder="Reported By" />
          <select v-model="form.status" class="field"><option>Unclaimed</option><option>Claimed</option><option>Pending</option></select>
          <textarea v-model="form.description" class="field sm:col-span-2" placeholder="Description" />
          <div class="sm:col-span-2"><ImageUploader v-model="form.photo" /></div>
        </div>
        <div class="mt-5 flex justify-end gap-2"><button class="btn-secondary" type="button" @click="modal = false">Cancel</button><button class="btn-primary">Save</button></div>
      </form>
    </div>
    <ConfirmDialog :open="Boolean(deleting)" title="Delete item" message="This found item will be permanently removed." @cancel="deleting = null" @confirm="remove" />
  </main>
</template>
