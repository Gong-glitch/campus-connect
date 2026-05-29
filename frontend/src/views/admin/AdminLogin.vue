<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { isValidEmail, sanitizeEmail } from "../../utils/inputProtection";
import { Eye, EyeOff } from "lucide-vue-next"; // 🚀 Icons for password toggle

const store = useStore();
const router = useRouter();
const error = ref("");
const isLoading = ref(false);
const showPassword = ref(false); // 🚀 Reactive state to track password visibility

// ✅ Inputs are completely empty and clean
const form = reactive({ email: "", password: "" });

// 🔓 FIXED: Removed the onMounted loop trigger that checked an empty local array!

async function login() {
  try {
    error.value = "";
    form.email = sanitizeEmail(form.email);

    if (!isValidEmail(form.email) || !form.password) {
      throw new Error("Enter valid admin credentials.");
    }

    isLoading.value = true;

    // 🖥️ 1. Send authentication payload to your live backend server database
    await store.login(form.email, form.password, "admin");

    // 🚀 2. Navigate straight to the dashboard once the live backend validates you!
    router.push("/admin/dashboard");
  } catch (err) {
    isLoading.value = false;
    error.value = err.response?.data?.message || err.message || "Invalid email or password.";
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
          <input v-model="form.email" class="field mt-1" type="email" placeholder="admin@carsu.edu.ph" :disabled="isLoading" required />
        </label>

        <label class="block">
          <span class="label">Password</span>
          <div class="relative mt-1">
            <input 
              v-model="form.password" 
              class="field pr-11" 
              :type="showPassword ? 'text' : 'password'" 
              :disabled="isLoading"
              required
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

      <button class="btn-primary mt-6 w-full flex items-center justify-center" :disabled="isLoading">
        <span v-if="isLoading">Logging in...</span>
        <span v-else>Login as Admin</span>
      </button>
      <RouterLink class="mt-4 block text-center text-sm font-semibold text-primary" to="/login">Student login</RouterLink>
    </form>
  </main>
</template>