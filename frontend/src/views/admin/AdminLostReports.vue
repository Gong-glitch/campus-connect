<script setup>
import { ref, onMounted } from "vue";
import { X, ImageIcon } from "lucide-vue-next";
import AdminTable from "../../components/shared/AdminTable.vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { api } from "../../services/api";

const selected = ref(null);
const rows = ref([]);
const errorMessage = ref("");

// 🎯 ENDPOINT CONFIGURATION
// If your backend throws a 404, change this string to match your exact Laravel route group.
// Common options: "/admin/reports", "/reports", "/admin/items"
  const ENDPOINT = "/lost-reports";

function mapRow(raw) {
  let rawPath = raw.image_path ?? raw.photo ?? raw.image ?? null;
  let finalPhotoUrl = null;

  if (rawPath) {
    if (rawPath.startsWith('http')) {
      finalPhotoUrl = rawPath;
    } else {
      let cleanPath = rawPath.trim().replace(/^\//, '');

      if (cleanPath.startsWith('public/storage/')) {
        cleanPath = cleanPath.substring(15);
      } else if (cleanPath.startsWith('storage/')) {
        cleanPath = cleanPath.substring(8);
      } else if (cleanPath.startsWith('app/public/')) {
        cleanPath = cleanPath.substring(11);
      }

      finalPhotoUrl = `https://campus-connect-api-0s3b.onrender.com/api/storage/${cleanPath}`;
    }
  }

  return {
    id: raw.id,
    name: raw.title ?? "",
    category: raw.category ?? "",
    location: raw.location ?? "",
    date: raw.date_lost ?? (raw.created_at ?? "").slice(0, 10),
    contactEmail: raw.contact_email ?? "",
    status: raw.status ?? "Open",
    description: raw.description ?? "",
    reportedBy: raw.user?.name ?? "",
    photo: finalPhotoUrl
  };
}

async function fetchReports() {
  errorMessage.value = "";
  try {
    const response = await api.get(ENDPOINT);
    const dataArray = Array.isArray(response) 
      ? response 
      : (response?.data || response?.reports || []);

    rows.value = dataArray.map(mapRow);
  } catch (err) {
    console.error("🔒 Admin Fetch Error Details:", err);
    if (err.message?.includes("404")) {
      errorMessage.value = `Route not found: ${ENDPOINT} returned 404. Check your Laravel api.php routes file.`;
    } else if (err.message?.includes("403")) {
      errorMessage.value = "Your current account token is valid, but it doesn't have database admin flags (403 Forbidden).";
    } else {
      errorMessage.value = "Failed to load admin records due to an interface communication error.";
    }
  }
}

onMounted(fetchReports);

async function flagMatched(id) {
  try {
    await api.patch(`${ENDPOINT}/${id}`, { status: "Matched" });
    await fetchReports();
  } catch (_) {}
}

async function archive(id) {
  try {
    await api.patch(`${ENDPOINT}/${id}`, { status: "Archived" });
    await fetchReports();
  } catch (_) {}
}

async function remove(id) {
  try {
    await api.delete(`${ENDPOINT}/${id}`);
    await fetchReports();
  } catch (_) {}
}

const columns = [
  { key: "name",         label: "Item Name" },
  { key: "category",     label: "Category" },
  { key: "location",     label: "Last Seen" },
  { key: "date",         label: "Date" },
  { key: "contactEmail", label: "Contact" },
  { key: "status",       label: "Status" }
];
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">Manage Lost Reports</h1>

    <div v-if="errorMessage" class="rounded bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
      {{ errorMessage }}
    </div>

    <AdminTable :columns="columns" :rows="rows">
      <template #status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #actions="{ row }">
        <div class="flex gap-2">
          <button class="btn-secondary px-3 py-1.5" @click="selected = row">View</button>
          <button class="btn-secondary px-3 py-1.5" @click="flagMatched(row.id)">Flag as Matched</button>
          <button class="btn-secondary px-3 py-1.5" @click="archive(row.id)">Archive</button>
          <button class="btn-danger px-3 py-1.5" @click="remove(row.id)">Delete</button>
        </div>
      </template>
    </AdminTable>
  </main>

  <Teleport to="body">
    <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="selected = null">
      <div class="w-full max-w-lg rounded-md bg-white shadow-xl">

        <div class="flex items-center justify-between border-b border-green-100 px-5 py-4">
          <h2 class="text-lg font-bold text-dark">Lost Report Details</h2>
          <button class="rounded-md p-1 text-muted hover:bg-light" @click="selected = null">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="space-y-4 px-5 py-5 text-sm">
          <div class="grid grid-cols-2 gap-x-4 gap-y-3">
            <div><p class="label">Item Name</p><p class="mt-0.5 font-medium text-dark">{{ selected.name }}</p></div>
            <div><p class="label">Category</p><p class="mt-0.5 font-medium text-dark">{{ selected.category }}</p></div>
            <div><p class="label">Last Seen Location</p><p class="mt-0.5 font-medium text-dark">{{ selected.location }}</p></div>
            <div><p class="label">Date Lost</p><p class="mt-0.5 font-medium text-dark">{{ selected.date }}</p></div>
            <div><p class="label">Contact Email</p><p class="mt-0.5 font-medium text-dark">{{ selected.contactEmail }}</p></div>
            <div><p class="label">Reported By</p><p class="mt-0.5 font-medium text-dark">{{ selected.reportedBy }}</p></div>
            <div><p class="label">Status</p><StatusBadge :status="selected.status" class="mt-0.5" /></div>
          </div>

          <div>
            <p class="label">Description</p>
            <p class="mt-1 whitespace-pre-wrap rounded-md bg-light px-3 py-2 text-dark">{{ selected.description }}</p>
          </div>

          <div>
            <p class="label">Item Image</p>
            <div class="mt-1 overflow-hidden rounded-md border border-gray-200 bg-light">
              <img 
                v-if="selected.photo" 
                :src="selected.photo" 
                alt="Reported item image" 
                class="max-h-60 w-full object-contain bg-gray-50 mx-auto"
              />
              <div v-else class="flex flex-col items-center justify-center py-8 text-muted">
                <ImageIcon class="h-8 w-8 stroke-[1.5]" />
                <p class="mt-1 text-xs">No image uploaded for this report</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end border-t border-green-100 px-5 py-4">
          <button class="btn-secondary" @click="selected = null">Close</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>