<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { isValidEmail, sanitizeEmail } from "../../utils/inputProtection";
import { Eye, EyeOff } from "lucide-vue-next"; // 🚀 ADDED: Icons for password toggle

const store = useStore();
const router = useRouter();
const error = ref("");
const showPassword = ref(false); // 🚀 ADDED: Reactive state to track password visibility

// ✅ Inputs are completely empty and clean
const form = reactive({ email: "", password: "" });

onMounted(() => {
  try {
    const hasAdmin = store.state.users.some((u) => u.role === "admin");
    if (!hasAdmin) {
      router.replace("/admin/setup");
    }
  } catch (err) {
    error.value = "Unable to verify admin status.";
  }
});

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
        <label class="block">
          <span class="label">Email</span>
          <input v-model="form.email" class="field mt-1" type="email" placeholder="admin@carsu.edu.ph" />
        </label>

        <label class="block">
          <span class="label">Password</span>
          <div class="relative mt-1">
            <input 
              v-model="form.password" 
              class="field pr-11" 
              :type="showPassword ? 'text' : 'password'" 
            />
            <button 
              type="button" 
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" 
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </label>
      </div>

      <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>

      <button class="btn-primary mt-6 w-full">Login as Admin</button>
      <RouterLink class="mt-4 block text-center text-sm font-semibold text-primary" to="/login">Student login</RouterLink>
    </form>
  </main>
</template>