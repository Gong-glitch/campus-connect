<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { isValidEmail, isStrongPassword, sanitizeEmail, sanitizeText } from "../../utils/inputProtection";
import { Eye, EyeOff } from "lucide-vue-next";

const store = useStore();
const router = useRouter();

const isLogin = ref(true);
const error = ref("");
const successMessage = ref("");
const showPassword = ref(false);

const loginForm = reactive({ email: "", password: "" });
const registerForm = reactive({ name: "", schoolId: "", email: "", password: "" });

// 🎯 FIXED: Rewired to invoke the central store API pipeline
async function handleLogin() {
  error.value = "";
  try {
    const email = sanitizeEmail(loginForm.email);
    if (!isValidEmail(email) || !loginForm.password) {
      throw new Error("Please enter a valid school email and password.");
    }

    // Hits your actual live Laravel container over the network!
    await store.login(email, loginForm.password, "user");

    // The store automatically updates state and handles route redirection now
  } catch (err) {
    error.value = err.message || "Invalid student credentials or account does not exist.";
  }
}

// 🎯 FIXED: Rewired registration to save data directly to PostgreSQL
async function handleRegister() {
  error.value = "";
  successMessage.value = "";
  try {
    const name = sanitizeText(registerForm.name, 120);
    const schoolId = sanitizeText(registerForm.schoolId, 40);
    const email = sanitizeEmail(registerForm.email);
    const password = String(registerForm.password ?? "");

    if (!name || !schoolId) throw new Error("Name and School ID are required.");
    if (!isValidEmail(email)) throw new Error("Please enter a valid school email address.");
    if (!isStrongPassword(password)) throw new Error("Password must be at least 8 characters with uppercase, lowercase, and a number.");

    // Calls the real API to store user data permanently
    await store.register({
      name,
      schoolId,
      email,
      password
    });

    successMessage.value = "Registration successful! Redirecting you home...";
  } catch (err) {
    error.value = err.message || "Registration failed. Please try again.";
  }
}
</script>

<template>
  <main class="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-light">

    <section class="flex flex-col justify-center items-center bg-primary text-white p-8 text-center lg:p-12">
      <div class="max-w-md space-y-6">
        <div class="flex justify-center">
          <img src="/cc-logo.light-large.png" alt="Campus Connect" class="h-24 w-auto object-contain drop-shadow-md" />
        </div>

        <p class="text-base lg:text-lg text-white/90 font-medium max-w-sm mx-auto">
          Report, browse, and claim lost or found items in one place.
        </p>
      </div>
    </section>

    <section class="flex items-center justify-center p-6 sm:p-12 bg-light">
      <div class="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-soft">

        <div class="grid grid-cols-2 gap-2 p-1 bg-light rounded-md border text-sm font-bold">
          <button 
            type="button" 
            class="py-2.5 rounded transition-all"
            :class="isLogin ? 'bg-white text-dark shadow-sm' : 'text-muted hover:text-dark'"
            @click="isLogin = true; error = ''; successMessage = '';"
          >
            Login
          </button>
          <button 
            type="button" 
            class="py-2.5 rounded transition-all"
            :class="!isLogin ? 'bg-white text-dark shadow-sm' : 'text-muted hover:text-dark'"
            @click="isLogin = false; error = ''; successMessage = '';"
          >
            Register
          </button>
        </div>

        <div v-if="error" class="p-3 bg-danger/10 text-danger rounded-md text-sm font-medium border border-danger/20">
          {{ error }}
        </div>
        <div v-if="successMessage" class="p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium">
          {{ successMessage }}
        </div>

        <form v-if="isLogin" class="space-y-4" @submit.prevent="handleLogin">
          <label class="block">
            <span class="label text-xs uppercase tracking-wider">School Email</span>
            <input v-model="loginForm.email" type="email" placeholder="student@carsu.edu.ph" class="field mt-1" required />
          </label>

          <label class="block">
            <span class="label text-xs uppercase tracking-wider">Password</span>
            <div class="relative mt-1">
              <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" class="field pr-11" placeholder="••••••••" required />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" class="h-4 w-4" /><Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </label>

          <button type="submit" class="btn-primary w-full mt-2 py-3 font-bold shadow-md tracking-wide">Sign In</button>
        </form>

        <form v-else class="space-y-4" @submit.prevent="handleRegister">
          <label class="block">
            <span class="label text-xs uppercase tracking-wider">Full Name</span>
            <input v-model="registerForm.name" type="text" placeholder="John Doe" class="field mt-1" required />
          </label>

          <label class="block">
            <span class="label text-xs uppercase tracking-wider">School ID</span>
            <input v-model="registerForm.schoolId" type="text" placeholder="211-00000" class="field mt-1" required />
          </label>

          <label class="block">
            <span class="label text-xs uppercase tracking-wider">School Email</span>
            <input v-model="registerForm.email" type="email" placeholder="username@carsu.edu.ph" class="field mt-1" required />
          </label>

          <label class="block">
            <span class="label text-xs uppercase tracking-wider">Password</span>
            <div class="relative mt-1">
              <input v-model="registerForm.password" :type="showPassword ? 'text' : 'password'" class="field pr-11" placeholder="••••••••" required />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" class="h-4 w-4" /><Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <span class="mt-1 block text-[11px] text-muted leading-tight">Must contain 8+ characters, including uppercase, lowercase, and a number.</span>
          </label>

          <button type="submit" class="btn-primary w-full mt-2 py-3 font-bold shadow-md tracking-wide">Create Account</button>
        </form>

        <div class="pt-4 border-t text-center">
          <RouterLink class="text-xs font-bold text-muted hover:text-dark transition-colors" to="/admin">
            Are you a portal Administrator? Go to Admin Login →
          </RouterLink>
        </div>

      </div>
    </section>
  </main>
</template>