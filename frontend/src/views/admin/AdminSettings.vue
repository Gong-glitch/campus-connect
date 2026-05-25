<script setup>
import { reactive, ref } from "vue";
import { Eye, EyeOff } from "lucide-vue-next";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
const form = reactive(JSON.parse(JSON.stringify(store.state.settings)));
const newCategory = ref("");
const newLocation = ref("");
const settingsSaved = ref(false);

const pwForm = reactive({ current: "", next: "", confirm: "" });
const pwError = ref("");
const pwSuccess = ref(false);
const showCurrent = ref(false);
const showNext = ref(false);
const showConfirm = ref(false);

function addCategory() {
  if (newCategory.value.trim()) form.categories.push(newCategory.value.trim());
  newCategory.value = "";
}
function addLocation() {
  if (newLocation.value.trim()) form.locations.push(newLocation.value.trim());
  newLocation.value = "";
}
function saveSettings() {
  store.saveSettings(form);
  settingsSaved.value = true;
  setTimeout(() => (settingsSaved.value = false), 2500);
}
function changePassword() {
  pwError.value = "";
  pwSuccess.value = false;
  if (!pwForm.current) { pwError.value = "Enter your current password."; return; }
  if (pwForm.next !== pwForm.confirm) { pwError.value = "New passwords do not match."; return; }
  try {
    store.changeAdminPassword(pwForm.current, pwForm.next);
    pwSuccess.value = true;
    pwForm.current = "";
    pwForm.next = "";
    pwForm.confirm = "";
    setTimeout(() => (pwSuccess.value = false), 3000);
  } catch (err) {
    pwError.value = err.message;
  }
}
</script>

<template>
  <AppNavbar role="admin" />
  <main class="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-dark">Settings</h1>

    <section class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-md bg-white p-5 shadow-soft">
        <h2 class="text-lg font-bold text-dark">Campus Locations</h2>
        <div class="mt-4 flex gap-2">
          <input v-model="newLocation" class="field" placeholder="Add location" @keyup.enter="addLocation" />
          <button class="btn-primary" @click="addLocation">Add</button>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button v-for="(location, index) in form.locations" :key="location" class="rounded-md bg-light px-3 py-2 text-sm font-semibold text-primary" @click="form.locations.splice(index, 1)">{{ location }} ×</button>
        </div>
      </div>
      <div class="rounded-md bg-white p-5 shadow-soft">
        <h2 class="text-lg font-bold text-dark">Item Categories</h2>
        <div class="mt-4 flex gap-2">
          <input v-model="newCategory" class="field" placeholder="Add category" @keyup.enter="addCategory" />
          <button class="btn-primary" @click="addCategory">Add</button>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button v-for="(category, index) in form.categories" :key="category" class="rounded-md bg-light px-3 py-2 text-sm font-semibold text-primary" @click="form.categories.splice(index, 1)">{{ category }} ×</button>
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
      <label class="flex items-center gap-3 font-semibold text-dark">
        <input v-model="form.announcementEnabled" type="checkbox" class="h-5 w-5 accent-primary" /> Announcement banner enabled
      </label>
      <textarea v-model="form.announcementText" class="field mt-4 min-h-24" />
    </section>

    <div class="flex items-center gap-4">
      <button class="btn-primary" @click="saveSettings">Save Settings</button>
      <span v-if="settingsSaved" class="text-sm font-medium text-green-700">Settings saved.</span>
    </div>

    <section class="rounded-md border border-gray-200 bg-white p-5 shadow-soft">
      <h2 class="text-lg font-bold text-dark">Change Admin Password</h2>
      <p class="mt-1 text-sm text-muted">Update your administrator login password.</p>
      <form class="mt-5 max-w-md space-y-4" @submit.prevent="changePassword">
        <label class="block">
          <span class="label">Current Password</span>
          <div class="relative mt-1">
            <input v-model="pwForm.current" class="field pr-11" :type="showCurrent ? 'text' : 'password'" autocomplete="current-password" />
            <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" @click="showCurrent = !showCurrent">
              <EyeOff v-if="showCurrent" class="h-4 w-4" /><Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </label>
        <label class="block">
          <span class="label">New Password</span>
          <div class="relative mt-1">
            <input v-model="pwForm.next" class="field pr-11" :type="showNext ? 'text' : 'password'" autocomplete="new-password" />
            <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" @click="showNext = !showNext">
              <EyeOff v-if="showNext" class="h-4 w-4" /><Eye v-else class="h-4 w-4" />
            </button>
          </div>
          <span class="mt-1 block text-xs text-muted">At least 8 characters with uppercase, lowercase, and a number.</span>
        </label>
        <label class="block">
          <span class="label">Confirm New Password</span>
          <div class="relative mt-1">
            <input v-model="pwForm.confirm" class="field pr-11" :type="showConfirm ? 'text' : 'password'" autocomplete="new-password" />
            <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" @click="showConfirm = !showConfirm">
              <EyeOff v-if="showConfirm" class="h-4 w-4" /><Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </label>
        <p v-if="pwError" class="text-sm text-danger">{{ pwError }}</p>
        <p v-if="pwSuccess" class="text-sm font-medium text-green-700">Password updated successfully.</p>
        <button class="btn-primary" type="submit">Update Password</button>
      </form>
    </section>
  </main>
</template>
