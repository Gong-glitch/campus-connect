<script setup>
import { computed, reactive, ref } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ConfirmDialog from "../../components/shared/ConfirmDialog.vue";
import StatusBadge from "../../components/shared/StatusBadge.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
const tab = ref("lost");
const editing = ref(null);
const deleting = ref(null);
const form = reactive({});

const lost = computed(() => store.state.lostReports.filter((report) => report.ownerEmail === store.state.session?.email));
const found = computed(() => store.state.foundReports.filter((report) => report.ownerEmail === store.state.session?.email));
const activeReports = computed(() => (tab.value === "lost" ? lost.value : found.value));

function edit(report) {
  editing.value = report.id;
  Object.assign(form, report);
}

function save() {
  store.updateReport(tab.value, editing.value, { ...form });
  editing.value = null;
}

function remove() {
  store.deleteReport(tab.value, deleting.value.id);
  deleting.value = null;
}
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">My Reports</h1>
    <div class="mt-5 flex gap-2 rounded-md bg-white p-2 shadow-soft">
      <button class="flex-1 rounded-md px-4 py-2 font-semibold" :class="tab === 'lost' ? 'bg-primary text-white' : 'text-muted'" @click="tab = 'lost'">My Lost Reports</button>
      <button class="flex-1 rounded-md px-4 py-2 font-semibold" :class="tab === 'found' ? 'bg-primary text-white' : 'text-muted'" @click="tab = 'found'">My Found Reports</button>
    </div>
    <div class="mt-6 grid gap-4">
      <article v-for="report in activeReports" :key="report.id" class="rounded-md bg-white p-5 shadow-soft">
        <template v-if="editing === report.id">
          <div class="grid gap-3 sm:grid-cols-2">
            <input v-model="form.name" class="field" />
            <input v-model="form.date" class="field" type="date" />
            <textarea v-model="form.description" class="field sm:col-span-2" />
          </div>
          <div class="mt-4 flex gap-2"><button class="btn-primary" @click="save">Save</button><button class="btn-secondary" @click="editing = null">Cancel</button></div>
        </template>
        <template v-else>
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-bold text-dark">{{ report.name }}</h2>
              <p class="text-sm text-muted">{{ report.date }} / {{ report.location }}</p>
            </div>
            <StatusBadge :status="report.status" />
          </div>
          <p class="mt-3 text-sm text-muted">{{ report.description }}</p>
          <div class="mt-4 flex gap-2">
            <button class="btn-secondary" @click="edit(report)">Edit</button>
            <button class="btn-danger" @click="deleting = report">Delete</button>
          </div>
        </template>
      </article>
      <p v-if="!activeReports.length" class="rounded-md bg-white p-8 text-center text-muted shadow-soft">No reports yet.</p>
    </div>
    <ConfirmDialog :open="Boolean(deleting)" title="Delete report" message="This report will be removed from your list." @cancel="deleting = null" @confirm="remove" />
  </main>
</template>
