<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { isValidEmail, sanitizeEmail } from "../../utils/inputProtection";
import { api } from "../../services/api";

const store = useStore();
const router = useRouter();
const error = ref("");
const loading = ref(false);
const form = reactive({ email: "", password: "" });

onMounted(async () => {
  try {
    const data = await api.get("/has-admin");
    if (!data.hasAdmin) router.replace("/admin/setup");
  } catch (_) {}
});

async function login() {
  error.value = "";
  loading.value = true;
  try {
    form.email = sanitizeEmail(form.email);
    if (!isValidEmail(form.email) || !form.password) throw new Error("Enter valid admin credentials.");
    await store.login(form.email, form.password, "admin");
    router.push("/admin/dashboard");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-light px-4">
    <form class="w-full max-w-md rounded-md border-t-4 border-primary bg-white p-7 shadow-soft" @submit.prevent="login">
      <h1 class="text-3xl font-bold text-dark">Admin Login</h1>
      <div class="mt-6 space-y-4">
        <label class="block"><span class="label">Email</span><input v-model="form.email" class="field mt-1" type="email" autocomplete="email" /></label>
        <label class="block"><span class="label">Password</span><input v-model="form.password" class="field mt-1" type="password" autocomplete="current-password" /></label>
      </div>
      <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>
      <button class="btn-primary mt-6 w-full" :disabled="loading">{{ loading ? "Logging in…" : "Login as Admin" }}</button>
      <RouterLink class="mt-4 block text-center text-sm font-semibold text-primary" to="/login">Student login</RouterLink>
    </form>
  </main>
</template>
