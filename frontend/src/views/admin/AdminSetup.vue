<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { isValidEmail, isStrongPassword, sanitizeEmail, sanitizeText } from "../../utils/inputProtection";

const store = useStore();
const router = useRouter();
const error = ref("");
const form = reactive({ name: "", email: "", password: "", confirm: "" });

onMounted(() => {
  try {
    const hasAdmin = store.state.users.some((u) => u.role === "admin");
    if (hasAdmin) {
      router.replace("/admin/login");
    }
  } catch (err) {
    error.value = "Unable to check admin status.";
  }
});

function submit() {
  try {
    const name = sanitizeText(form.name, 120);
    const email = sanitizeEmail(form.email);
    const password = String(form.password ?? "");

    if (!name) throw new Error("Name is required.");
    if (!isValidEmail(email)) throw new Error("Enter a valid email address.");
    if (!isStrongPassword(password)) throw new Error("Password must be at least 8 characters with uppercase, lowercase, and a number.");
    if (password !== form.confirm) throw new Error("Passwords do not match.");
    if (store.state.users.some((u) => u.email === email)) throw new Error("An account with this email already exists.");

    store.state.users.push({
      id: crypto.randomUUID(),
      name,
      email,
      password,
      schoolId: "999-00000",
      role: "admin",
      status: "Active",
      joinDate: new Date().toISOString().slice(0, 10)
    });
    store.persist();

    router.replace("/admin/login");
  } catch (err) {
    error.value = err.message;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-light px-4">
    <form class="w-full max-w-md rounded-md border-t-4 border-primary bg-white p-7 shadow-soft" @submit.prevent="submit">
      <h1 class="text-3xl font-bold text-dark">Admin Setup</h1>
      <p class="mt-1 text-sm text-gray-500">Create the first administrator account.</p>
      <div class="mt-6 space-y-4">
        <label class="block"><span class="label">Full Name</span><input v-model="form.name" class="field mt-1" type="text" required /></label>
        <label class="block"><span class="label">Email</span><input v-model="form.email" class="field mt-1" type="email" required /></label>
        <label class="block"><span class="label">Password</span><input v-model="form.password" class="field mt-1" type="password" required /></label>
        <label class="block"><span class="label">Confirm Password</span><input v-model="form.confirm" class="field mt-1" type="password" required /></label>
      </div>
      <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>
      <button class="btn-primary mt-6 w-full">Create Admin Account</button>
    </form>
  </main>
</template>
