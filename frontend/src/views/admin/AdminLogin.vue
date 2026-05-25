<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { isValidEmail, sanitizeEmail } from "../../utils/inputProtection";

const store = useStore();
const router = useRouter();
const error = ref("");
const form = reactive({ email: "admin@carsu.edu.ph", password: "admin123" });

function login() {
  try {
    form.email = sanitizeEmail(form.email);
    if (!isValidEmail(form.email) || !form.password) throw new Error("Enter valid admin credentials.");
    store.login(form.email, form.password, "admin");
    router.push("/admin/dashboard");
  } catch (err) {
    error.value = err.message;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-light px-4">
    <form class="w-full max-w-md rounded-md border-t-4 border-primary bg-white p-7 shadow-soft" @submit.prevent="login">
      <h1 class="text-3xl font-bold text-dark">Admin Login</h1>
      <div class="mt-6 space-y-4">
        <label class="block"><span class="label">Email</span><input v-model="form.email" class="field mt-1" type="email" /></label>
        <label class="block"><span class="label">Password</span><input v-model="form.password" class="field mt-1" type="password" /></label>
      </div>
      <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>
      <button class="btn-primary mt-6 w-full">Login as Admin</button>
      <RouterLink class="mt-4 block text-center text-sm font-semibold text-primary" to="/login">Student login</RouterLink>
    </form>
  </main>
</template>
