<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router"; 
import { Loader2 } from "lucide-vue-next";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ImageUploader from "../../components/shared/ImageUploader.vue";
import { useStore } from "../../composables/useStore";
import { api } from "../../services/api"; 
import { isValidEmail, sanitizeReportPayload } from "../../utils/inputProtection";

const store = useStore();
const router = useRouter(); 

const reference = ref("");
const saving = ref(false);
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

  async function submit() {
    errors.value = {};
    if (!form.name || form.name.length < 3) errors.value.name = "Item name must be at least 3 characters.";
    if (!form.description || form.description.length < 12) errors.value.description = "Description must be at least 12 characters.";
    if (!form.location || form.location.length < 3) errors.value.location = "Location must be at least 3 characters.";
    if (!form.date) errors.value.date = "Date lost is required.";
    if (Object.keys(errors.value).length) return;

    saving.value = true;
    try {
      const backendPayload = {
        title: form.name,
        description: form.description,
        category: form.category,
        location: form.location,
        date_lost: form.date, // Matching Laravel precisely
        status: "Open"
      };

      const response = await api.post("/lost-reports", backendPayload);

      // 🎯 Only show success screen if the server actually returns a valid ID
      if (response && (response.id || response.report?.id)) {
        reference.value = String(response.id || response.report.id);
      } else {
        throw new Error("Server did not save the report record.");
      }

      await store.fetchMyReports();

    } catch (err) {
      console.error("Submission error:", err);
      // 🎯 Captures the error so it shows up on screen instead of faking success
      errors.value.form = err.response?.data?.message || "Session expired. Please log out and back in.";
    } finally {
      saving.value = false;
    }
  }
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

    <section v-if="reference" class="rounded-md bg-white p-8 text-center shadow-soft">
      <h1 class="text-3xl font-bold text-primary">Thank you for reporting a lost item</h1>
      <p class="mt-3 text-muted">Your report has been received and logged to the campus network.</p>
      <p class="mt-3 text-muted">Reference Number</p>
      <p class="mt-1 text-2xl font-bold text-dark">#{{ reference }}</p>

      <button class="btn-primary mt-6 inline-block px-6 py-2" @click="router.push('/my-reports')">
        View My Reports
      </button>
    </section>

    <form v-else class="rounded-md bg-white p-6 shadow-soft" @submit.prevent="submit">
      <h1 class="text-3xl font-bold text-dark">Report Lost Item</h1>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <label>
          <span class="label">Item Name</span>
          <input v-model="form.name" class="field mt-1" placeholder="e.g. Umbrella, Wallet" />
          <span v-if="errors.name" class="text-xs text-danger">{{ errors.name }}</span>
        </label>

        <label>
          <span class="label">Category</span>
          <select v-model="form.category" class="field mt-1">
            <option v-for="category in store.state.settings.categories" :key="category">{{ category }}</option>
          </select>
        </label>

        <label class="sm:col-span-2">
          <span class="label">Description / Distinguishing Features</span>
          <textarea v-model="form.description" class="field mt-1 min-h-28" placeholder="Provide distinct features like color, brand, stickers..." />
          <span v-if="errors.description" class="text-xs text-danger">{{ errors.description }}</span>
        </label>

        <label>
          <span class="label">Where Lost (Last Seen)</span>
          <input v-model="form.location" class="field mt-1" list="lost-location-options" placeholder="Type location or choose suggestion" />
          <datalist id="lost-location-options">
            <option v-for="location in store.state.settings.locations" :key="location" :value="location" />
          </datalist>
          <span v-if="errors.location" class="text-xs text-danger">{{ errors.location }}</span>
        </label>

        <label>
          <span class="label">Date Lost</span>
          <input v-model="form.date" class="field mt-1" type="date" />
          <span v-if="errors.date" class="text-xs text-danger">{{ errors.date }}</span>
        </label>

        <label class="sm:col-span-2">
          <span class="label">Contact Email</span>
          <input v-model="form.contactEmail" class="field mt-1" type="email" />
          <span v-if="errors.contactEmail" class="text-xs text-danger">{{ errors.contactEmail }}</span>
        </label>

        <div class="sm:col-span-2">
          <span class="label">Photo Upload (Optional)</span>
          <ImageUploader v-model="form.photo" class="mt-1" />
        </div>
      </div>

      <p v-if="errors.form" class="mt-3 text-sm text-danger-text bg-danger/10 border border-danger/20 rounded p-3">{{ errors.form }}</p>

      <button type="submit" class="btn-primary mt-6 flex w-full items-center justify-center gap-2" :disabled="saving">
        <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
        {{ saving ? "Submitting…" : "Submit Lost Report" }}
      </button>
    </form>

  </main>
</template>