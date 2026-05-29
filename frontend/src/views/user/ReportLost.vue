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
  // Sanitize values from input protection utility
  const clean = sanitizeReportPayload(form);
  Object.assign(form, clean);
  errors.value = {};

  // Form Validations
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

  // Halt execution if any validation fails
  if (Object.keys(errors.value).length) return;

  try {
    // Explicitly bundle the logged-in user's email into the payload object
    const submissionPayload = {
      ...form,
      ownerEmail: store.state.session?.email || "anonymous@carsu.edu.ph"
    };

    // Dispatch payload to appStore and capture the return reference ID
    reference.value = store.addFoundReport(submissionPayload);

    // Reset fields cleanly upon success
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
            <textarea v-model="form.description" class="field mt-1 min-h-28" placeholder="Provide distinct features (color, serial codes, case identity)..." />
            <span v-if="errors.description" class="text-xs text-danger mt-1 block">{{ errors.description }}</span>
          </label>

          <label class="block">
            <span class="label">Where Found</span>
            <input v-model="form.location" class="field mt-1" list="found-location-options" placeholder="Type location or select suggestion" />
            <datalist id="found-location-options">
              <option v-for="loc in store.state.settings.locations" :key="loc" :value="loc" />
            </datalist>