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

  function mapRow(raw) {
    // 1️⃣ Grab whatever image key the backend is returning
    let rawPath = raw.image_path ?? raw.photo ?? raw.image ?? null;
    let finalPhotoUrl = null;

    if (rawPath) {
      // 2️⃣ If it's already a full URL (starts with http), use it directly
      if (rawPath.startsWith('http')) {
        finalPhotoUrl = rawPath;
      } else {
        // 3️⃣ If it's a relative path, strip any leading slashes and attach your live Render API host
        const cleanPath = rawPath.replace(/^\//, '');
        finalPhotoUrl = `https://campus-connect-api-0s3b.onrender.com/${cleanPath}`;
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
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const config = {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };

    const response = await api.get("/lost-reports", config);

    const dataArray = Array.isArray(response) 
      ? response 
      : (response?.data || response?.reports || []);

    rows.value = dataArray.map(mapRow);
  } catch (err) {
    console.error("🔒 Admin Fetch Error Details:", err);
    if (err.response?.status === 403 || err.message?.includes("403")) {
      errorMessage.value = "Your current Admin account doesn't have database permissions to view user reports (403 Forbidden).";
    } else {
      errorMessage.value = "Failed to load records due to a server authentication error.";
    }
  }
}

onMounted(fetchReports);

async function flagMatched(id) {
  try {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const config = { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    await api.patch(`/lost-reports/${id}`, { status: "Matched" }, config);
    await fetchReports();
  } catch (_) {}
}

async function archive(id) {
  try {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const config = { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    await api.patch(`/lost-reports/${id}`, { status: "Archived" }, config);
    await fetchReports();
  } catch (_) {}
}

async function remove(id) {
  try {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const config = { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    await api.delete(`/lost-reports/${id}`, config);
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
          <button class="rounded-md p-1 text-muted hover:bg-light" @click="selected = null"><X class="h-5 w-5" /></button>
        </div>
        <div class="space-y-3 px-5 py-5 text-sm">
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
                class="max-h-60 w-full object-contain bg-gray-50"
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