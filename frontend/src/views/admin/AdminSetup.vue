<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { Eye, EyeOff, ShieldCheck } from "lucide-vue-next";
import { isValidEmail, isValidSchoolId, isStrongPassword, sanitizeEmail, sanitizeText } from "../../utils/inputProtection";
import { api } from "../../services/api";

const store = useStore();
const router = useRouter();
const error = ref("");
const loading = ref(false);
const success = ref(false);
const showPassword = ref(false);
const showConfirm = ref(false);

const form = reactive({ name: "", schoolId: "", email: "", password: "", confirm: "" });

onMounted(async () => {
  try {
    const data = await api.get("/has-admin");
    if (data.hasAdmin) router.replace("/admin");
  } catch (_) {}
});

async function submit() {
  error.value = "";
  form.name = sanitizeText(form.name, 120);
  form.schoolId = sanitizeText(form.schoolId, 40);
  form.email = sanitizeEmail(form.email);

  if (!form.name) { error.value = "Full name is required."; return; }
  if (!isValidSchoolId(form.schoolId)) { error.value = "School ID must be in format 211-00087."; return; }
  if (!isValidEmail(form.email)) { error.value = "Enter a valid school email address."; return; }
  if (!isStrongPassword(form.password)) { error.value = "Password must be at least 8 characters with uppercase, lowercase, and a number."; return; }
  if (form.password !== form.confirm) { error.value = "Passwords do not match."; return; }

  loading.value = true;
  try {
    await store.createAdmin({ name: form.name, schoolId: form.schoolId, email: form.email, password: form.password });
    success.value = true;
    setTimeout(() => router.push("/admin"), 2000);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-light px-4 py-10">
    <div class="w-full max-w-md">
      <div class="mb-6 flex flex-col items-center gap-2 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow">
          <ShieldCheck class="h-7 w-7" />
        </div>
        <h1 class="text-2xl font-bold text-dark">First-Time Admin Setup</h1>
        <p class="text-sm text-muted">Create the administrator account for this system. This page is only accessible once.</p>
      </div>

      <div v-if="success" class="rounded-md border border-green-200 bg-green-50 px-5 py-4 text-center text-sm font-medium text-green-800">
        Admin account created successfully. Redirecting to login…
      </div>

      <form v-else class="rounded-md border-t-4 border-primary bg-white p-7 shadow-soft" @submit.prevent="submit">
        <div class="space-y-4">
          <label class="block">
            <span class="label">Full Name</span>
            <input v-model="form.name" class="field mt-1" type="text" autocomplete="name" />
          </label>

          <label class="block">
            <span class="label">School ID</span>
            <input v-model="form.schoolId" class="field mt-1" type="text" placeholder="211-00087" autocomplete="off" />
          </label>

          <label class="block">
            <span class="label">School Email</span>
            <input v-model="form.email" class="field mt-1" type="email" autocomplete="email" />
          </label>

          <label class="block">
            <span class="label">Password</span>
            <div class="relative mt-1">
              <input v-model="form.password" class="field pr-11" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <span class="mt-1 block text-xs text-muted">At least 8 characters with uppercase, lowercase, and a number.</span>
          </label>

          <label class="block">
            <span class="label">Confirm Password</span>
            <div class="relative mt-1">
              <input v-model="form.confirm" class="field pr-11" :type="showConfirm ? 'text' : 'password'" autocomplete="new-password" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" @click="showConfirm = !showConfirm">
                <EyeOff v-if="showConfirm" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </label>

          <p v-if="error" class="text-sm text-danger">{{ error }}</p>

          <button class="btn-primary w-full" type="submit" :disabled="loading">
            {{ loading ? "Creating account…" : "Create Admin Account" }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>
