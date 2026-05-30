<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { Loader2 } from "lucide-vue-next";
import AdminTable from "../../components/shared/AdminTable.vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ConfirmDialog from "../../components/shared/ConfirmDialog.vue";
import ImageUploader from "../../components/shared/ImageUploader.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";
import { api } from "../../services/api";

const store = useStore();
const search = ref("");
const modal = ref(false);
const saving = ref(false);
const saveError = ref("");
const editing = ref(null);
const deleting = ref(null);
const deleteLoading = ref(false);
const pendingItems = ref([]);

const form = reactive({
  name: "", category: "Electronics", location: "CCIS Building",
  status: "Unclaimed", description: "", photo: ""
});

const columns = [
  { key: "photo",       label: "Photo" },
  { key: "name",        label: "Item Name", sortable: true },
  { key: "category",    label: "Category" },
  { key: "location",    label: "Location" },
  { key: "date",        label: "Date" },
  { key: "reportedBy",  label: "Reported By" },
  { key: "status",      label: "Status" }
];

const pendingColumns = [
  { key: "name",         label: "Report Item", sortable: true },
  { key: "category",     label: "Category" },
  { key: "location",     label: "Where Found" },
  { key: "date",         label: "Date Found" },
  { key: "contactEmail", label: "Contact" },
  { key: "status",       label: "Review Status" }
];

// 🖼️ DYNAMIC IMAGE CLEANING PIPELINE
// Formats raw paths out of row entries into live asset stream links
function getCleanPhotoUrl(rowItem) {
  if (!rowItem) return "https://placehold.co/150?text=No+Image";

  let rawPath = rowItem.photo ?? rowItem.image_path ?? rowItem.image ?? null;
  if (!rawPath) return "https://placehold.co/150?text=No+Image";

  if (rawPath.startsWith("http")) {
    return rawPath;
  }

  let cleanPath = rawPath.trim().replace(/^\//, "");

  if (cleanPath.startsWith("public/storage/")) {
    cleanPath = cleanPath.substring(15);
  } else if (cleanPath.startsWith("storage/")) {
    cleanPath = cleanPath.substring(8);
  } else if (cleanPath.startsWith("app/public/")) {
    cleanPath = cleanPath.substring(11);
  }

  return `https://campus-connect-api-0s3b.onrender.com/api/storage/${cleanPath}`;
}

const rows = computed(() =>
  store.state.foundItems.filter((i) => i.name.toLowerCase().includes(search.value.toLowerCase()))
);

const pendingRows = computed(() =>
  pendingItems.value.filter((r) =>
    ["Pending Approval", "Rejected"].includes(r.status) &&
    r.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

function mapPendingItem(raw) {
  return {
    id: raw.id,
    name: raw.title ?? "",
    category: raw.category ?? "",
    location: raw.location ?? "",
    date: (raw.found_date ?? raw.created_at ?? "").slice(0, 10),
    contactEmail: raw.contact_email ?? "",
    status: raw.status ?? "Pending Approval",
    description: raw.description ?? ""
  };
}

async function fetchPending() {
  try {
    const raw = await api.get("/items?pending=1");
    pendingItems.value = raw.map(mapPendingItem);
  } catch (_) {}
}

onMounted(() => {
  store.fetchItems();
  fetchPending();
});

function openAdd() {
  editing.value = null;
  saveError.value = "";
  Object.assign(form, { name: "", category: "Electronics", location: "CCIS Building", status: "Unclaimed", description: "", photo: "" });
  modal.value = true;
}

function openEdit(item) {
  editing.value = item.id;
  saveError.value = "";
  Object.assign(form, { name: item.name, category: item.category, location: item.location, status: item.status, description: item.description, photo: item.photo || "" });
  modal.value = true;
}

async function save() {
  saving.value = true;
  saveError.value = "";
  const payload = {
    title:       form.name,
    description: form.description,
    category:    form.category,
    location:    form.location,
    status:      form.status,
    image_path:  form.photo || null
  };
  try {
    if (editing.value) {
      await api.put(`/items/${editing.value}`, payload);
    } else {
      await api.post("/items", payload);
    }
    modal.value = false;
    await store.fetchItems();
  } catch (err) {
    saveError.value = err.message || "Failed to save item.";
  } finally {
    saving.value = false;
  }
}

async function remove() {
  deleteLoading.value = true;
  try {
    await api.delete(`/items/${deleting.value.id}`);
    deleting.value = null;
    await store.fetchItems();
  } catch (err) {
    alert(err.message || "Failed to delete item.");
  } finally {
    deleteLoading.value = false;
  }
}

// 🛠️ FIXED: Added authorization interceptor config parameters to resolve 403 Forbidden drops
async function markClaimed(item) {
  try {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const config = {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };

    await api.put(`/items/${item.id}`, { status: "Claimed" }, config);
    await store.fetchItems();
  } catch (err) {
    alert(err.response?.data?.message || err.message || "Failed to update status.");
  }
}

// Approve: PATCH the existing pending item to 'Unclaimed', then refresh both lists
async function approveReport(id) {
  try {
    await store.approveFoundReport(id);
    await fetchPending();
  } catch (err) {
    alert(err.message || "Failed to approve report.");
  }
}

// Reject: PATCH the item to 'Rejected', then refresh the pending list
async function rejectReport(id) {
  try {
    await store.rejectFoundReport(id);
    await fetchPending();
  } catch (err) {
    alert(err.message || "Failed to reject report.");
  }
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
            <button class="btn-primary px-3 py-1.5" @click="approveReport(row.id)">Approve</button>
            <button class="btn-danger px-3 py-1.5" @click="rejectReport(row.id)">Reject</button>
          </div>
        </template>
      </AdminTable>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-bold text-dark">Published Found Items</h2>
      <AdminTable :columns="columns" :rows="rows">
        <template #photo="{ row }">
          <img 
            :src="getCleanPhotoUrl(row)" 
            :alt="row.name" 
            class="h-12 w-16 rounded-md object-cover bg-gray-50 border border-gray-100" 
            @error="(e) => e.target.src = 'https://placehold.co/150?text=No+Image'"
          />
        </template>
        <template #status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #actions="{ row }">
          <div class="flex gap-2">
            <RouterLink class="btn-secondary px-3 py-1.5" :to="`/items/${row.id}`">View</RouterLink>
            <button class="btn-secondary px-3 py-1.5" @click="openEdit(row)">Edit</button>
            <button class="btn-secondary px-3 py-1.5" @click="markClaimed(row)">Mark as Claimed</button>
            <button class="btn-danger px-3 py-1.5" @click="deleting = row">Delete</button>
          </div>
        </template>
      </AdminTable>
    </section>

    <Teleport to="body">
      <div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="modal = false">
        <form class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white p-6 shadow-soft" @submit.prevent="save">
          <h2 class="text-2xl font-bold text-dark">{{ editing ? "Edit Item" : "Add Item" }}</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <input v-model="form.name" class="field" placeholder="Item Name" required />
            <select v-model="form.category" class="field">
              <option v-for="cat in store.state.settings.categories" :key="cat">{{ cat }}</option>
            </select>
            <select v-model="form.location" class="field">
              <option v-for="loc in store.state.settings.locations" :key="loc">{{ loc }}</option>
            </select>
            <select v-model="form.status" class="field">
              <option>Unclaimed</option>
              <option>Claimed</option>
              <option>Pending</option>
            </select>
            <textarea v-model="form.description" class="field sm:col-span-2" placeholder="Description" rows="3" />
            <div class="sm:col-span-2">
              <ImageUploader v-model="form.photo" />
            </div>
          </div>
          <p v-if="saveError" class="mt-2 text-sm text-danger">{{ saveError }}</p>
          <div class="mt-5 flex justify-end gap-2">
            <button class="btn-secondary" type="button" @click="modal = false">Cancel</button>
            <button class="btn-primary flex items-center gap-2" :disabled="saving">
              <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
              {{ saving ? "Saving…" : "Save" }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <ConfirmDialog
      :open="Boolean(deleting)"
      title="Delete item"
      message="This found item will be permanently removed from the database."
      :loading="deleteLoading"
      @cancel="deleting = null"
      @confirm="remove"
    />
  </main>
</template>