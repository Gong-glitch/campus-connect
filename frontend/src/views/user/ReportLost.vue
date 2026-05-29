<script setup>
import { reactive, ref } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ImageUploader from "../../components/shared/ImageUploader.vue";
import { useStore } from "../../composables/useStore";
import { isValidEmail, sanitizeReportPayload } from "../../utils/inputProtection";

const store = useStore();
const reference = ref("");
const errors = ref({});
const form = reactive({ 
  name: "", 
  category: "Electronics", 
  description: "", 
  location: "CCIS Building", 
  date: "", 
  contactEmail: "", 
  photo: "" 
});

function submit() {
  const clean = sanitizeReportPayload(form);
  Object.assign(form, clean);
  errors.value = {};

  if (!form.name || form.name.length < 3) {
    errors.value.name = "Item name must be at least 3 characters.";
  }
  if (!form.description || form.description.length < 12) {
    errors.value.description = "Description must be at least 12 characters.";
  }
  if (!form.location || form.location.length < 3) {
    errors.value.location = "Location must be at least 3 characters.";
  }
  if (!form.date) {
    errors.value.date = "Date found is required.";
  }
  if (!isValidEmail(form.contactEmail)) {
    errors.value.contactEmail = "Enter a valid contact email.";
  }

  if (Object.keys(errors.value).length) return;

  try {
    const submissionPayload = {
      ...form,
      ownerEmail: store.state.session?.email || "anonymous@carsu.edu.ph"
    };

    reference.value = store.addFoundReport(submissionPayload);

    Object.assign(form, { name: "", description: "", date: "", contactEmail: "", photo: "" });
  } catch (err) {
    errors.value.form = err.message || "Unable to submit found report.";
  }
}
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="rounded-md bg-white p-6 shadow-soft sm:p-8">
      <h1 class="text-3xl font-bold text-dark">Report Found Item</h1>
      <p class="mt-1 text-sm text-muted">Fill out detailed parameters accurately to verify authentic items.</p>

      <form class="mt-8 space-y-5" @submit.prevent="submit">
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="block">
            <span class="label">Item Name</span>
            <input v-model="form.name" class="field mt-1" placeholder="e.g. iPhone 13 Pro" />
            <span v-if="errors.name" class="text-xs text-danger mt-1 block">{{ errors.name }}</span>
          </label>

          <label class="block">
            <span class="label">Category</span>
            <select v-model="form.category" class="field mt-1">
              <option v-for="cat in store.state.settings.categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </label>

          <label class="block sm:col-span-2">
            <span class="label">Description</span>
            <textarea v-model="form.description" class="field mt-1 min-h-28" placeholder="Provide distinct features..." />
            <span v-if="errors.description" class="text-xs text-danger mt-1 block">{{ errors.description }}</span>
          </label>

          <label class="block">
            <span class="label">Where Found</span>
            <input v-model="form.location" class="field mt-1" list="found-location-options" placeholder="Type location or select suggestion" />
            <datalist id="found-location-options">
              <option v-for="loc in store.state.settings.locations" :key="loc" :value="loc" />
            </datalist>
            <span v-if="errors.location" class="text-xs text-danger mt-1 block">{{ errors.location }}</span>
          </label>

          <label class="block">
            <span class="label">Date Found</span>
            <input v-model="form.date" class="field mt-1" type="date" />
            <span v-if="errors.date" class="text-xs text-danger mt-1 block">{{ errors.date }}</span>
          </label>

          <label class="block sm:col-span-2">
            <span class="label">Contact Email</span>
            <input v-model="form.contactEmail" class="field mt-1" type="email" placeholder="owner-lookup@carsu.edu.ph" />
            <span v-if="errors.contactEmail" class="text-xs text-danger mt-1 block">{{ errors.contactEmail }}</span>
          </label>

          <div class="block sm:col-span-2">
            <span class="label">Photo Upload</span>
            <ImageUploader v-model="form.photo" class="mt-1" />
          </div>
        </div>

        <div v-if="errors.form" class="rounded-md bg-danger/10 p-3 text-sm text-danger">
          {{ errors.form }}
        </div>

        <div v-if="reference" class="rounded-md bg-green-50 p-4 border border-green-100 text-sm text-dark">
          <p class="font-semibold text-primary">Report Saved Successfully!</p>
          <p class="mt-1">Please record your item reference ID: <code class="font-mono bg-light px-1 py-0.5 rounded text-primary font-bold">{{ reference }}</code></p>
        </div>

        <div class="mt-6 flex justify-end">
          <button class="btn-primary w-full sm:w-auto px-6 py-2.5" type="submit">
            Submit Found Report
          </button>
        </div>
      </form>
    </div>
  </main>
</template>