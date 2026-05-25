<script setup>
import { reactive, ref } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ImageUploader from "../../components/shared/ImageUploader.vue";
import { useStore } from "../../composables/useStore";
import { isValidEmail, sanitizeReportPayload } from "../../utils/inputProtection";

const store = useStore();
const reference = ref("");
const errors = ref({});
const form = reactive({ name: "", category: "Electronics", description: "", location: "CCIS Building", date: "", contactEmail: "", photo: "" });

function submit() {
  const clean = sanitizeReportPayload(form);
  Object.assign(form, clean);
  errors.value = {};
  if (!form.name || form.name.length < 3) errors.value.name = "Item name must be at least 3 characters.";
  if (!form.description || form.description.length < 12) errors.value.description = "Description must be at least 12 characters.";
  if (!form.location || form.location.length < 3) errors.value.location = "Location must be at least 3 characters.";
  if (!form.date) errors.value.date = "Date found is required.";
  if (!isValidEmail(form.contactEmail)) errors.value.contactEmail = "Enter a valid contact email.";
  if (Object.keys(errors.value).length) return;
  try {
    reference.value = store.addFoundReport({ ...form });
  } catch (err) {
    errors.value.form = err.message || "Unable to submit found report.";
  }
}
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
    <section v-if="reference" class="rounded-md bg-white p-8 text-center shadow-soft">
      <h1 class="text-3xl font-bold text-primary">Thank you for reporting a found item</h1>
      <p class="mt-3 text-muted">Your report is pending admin approval before it appears in public listings.</p>
      <p class="mt-3 text-muted">Reference Number</p>
      <p class="mt-1 text-2xl font-bold text-dark">{{ reference }}</p>
      <RouterLink class="btn-primary mt-6" to="/my-reports">View My Reports</RouterLink>
    </section>
    <form v-else class="rounded-md bg-white p-6 shadow-soft" @submit.prevent="submit">
      <h1 class="text-3xl font-bold text-dark">Report Found Item</h1>
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <label><span class="label">Item Name</span><input v-model="form.name" class="field mt-1" /><span v-if="errors.name" class="text-xs text-danger">{{ errors.name }}</span></label>
        <label><span class="label">Category</span><select v-model="form.category" class="field mt-1"><option v-for="category in store.state.settings.categories" :key="category">{{ category }}</option></select></label>
        <label class="sm:col-span-2"><span class="label">Description</span><textarea v-model="form.description" class="field mt-1 min-h-28" /><span v-if="errors.description" class="text-xs text-danger">{{ errors.description }}</span></label>
        <label>
          <span class="label">Where Found</span>
          <input v-model="form.location" class="field mt-1" list="found-location-options" placeholder="Type location or choose suggestion" />
          <datalist id="found-location-options">
            <option v-for="location in store.state.settings.locations" :key="location" :value="location" />
          </datalist>
          <span v-if="errors.location" class="text-xs text-danger">{{ errors.location }}</span>
        </label>
        <label><span class="label">Date Found</span><input v-model="form.date" class="field mt-1" type="date" /><span v-if="errors.date" class="text-xs text-danger">{{ errors.date }}</span></label>
        <label class="sm:col-span-2"><span class="label">Contact Email</span><input v-model="form.contactEmail" class="field mt-1" type="email" /><span v-if="errors.contactEmail" class="text-xs text-danger">{{ errors.contactEmail }}</span></label>
        <div class="sm:col-span-2"><span class="label">Photo Upload</span><ImageUploader v-model="form.photo" class="mt-1" /></div>
      </div>
      <p v-if="errors.form" class="mt-3 text-sm text-danger">{{ errors.form }}</p>
      <button class="btn-primary mt-6 w-full">Submit Found Report</button>
    </form>
  </main>
</template>
