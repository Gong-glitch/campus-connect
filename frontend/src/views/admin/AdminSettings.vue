<script setup>
import { reactive, ref } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
const form = reactive(JSON.parse(JSON.stringify(store.state.settings)));
const newCategory = ref("");
const newLocation = ref("");

function addCategory() {
  if (newCategory.value) form.categories.push(newCategory.value);
  newCategory.value = "";
}
function addLocation() {
  if (newLocation.value) form.locations.push(newLocation.value);
  newLocation.value = "";
}
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">Settings</h1>
    <section class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-md bg-white p-5 shadow-soft">
        <h2 class="text-lg font-bold text-dark">Campus Locations</h2>
        <div class="mt-4 flex gap-2"><input v-model="newLocation" class="field" placeholder="Add location" /><button class="btn-primary" @click="addLocation">Add</button></div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button v-for="(location, index) in form.locations" :key="location" class="rounded-md bg-light px-3 py-2 text-sm font-semibold text-primary" @click="form.locations.splice(index, 1)">{{ location }} x</button>
        </div>
      </div>
      <div class="rounded-md bg-white p-5 shadow-soft">
        <h2 class="text-lg font-bold text-dark">Item Categories</h2>
        <div class="mt-4 flex gap-2"><input v-model="newCategory" class="field" placeholder="Add category" /><button class="btn-primary" @click="addCategory">Add</button></div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button v-for="(category, index) in form.categories" :key="category" class="rounded-md bg-light px-3 py-2 text-sm font-semibold text-primary" @click="form.categories.splice(index, 1)">{{ category }} x</button>
        </div>
      </div>
    </section>
    <section class="rounded-md bg-white p-5 shadow-soft">
      <h2 class="text-lg font-bold text-dark">Office Information</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label><span class="label">Office Hours</span><input v-model="form.officeHours" class="field mt-1" /></label>
        <label><span class="label">Contact Info</span><input v-model="form.contactInfo" class="field mt-1" /></label>
      </div>
    </section>
    <section class="rounded-md bg-white p-5 shadow-soft">
      <label class="flex items-center gap-3 font-semibold text-dark"><input v-model="form.announcementEnabled" type="checkbox" class="h-5 w-5 accent-primary" /> Announcement banner enabled</label>
      <textarea v-model="form.announcementText" class="field mt-4 min-h-24" />
    </section>
    <button class="btn-primary" @click="store.saveSettings(form)">Save Settings</button>
  </main>
</template>
