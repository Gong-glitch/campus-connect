<script setup>
import { reactive, ref } from "vue";
import { Eye, EyeOff } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { isStrongPassword, isValidEmail, isValidSchoolId, sanitizeEmail, sanitizeText } from "../../utils/inputProtection";

const store = useStore();
const router = useRouter();
const tab = ref("login");
const error = ref("");
const showLoginPassword = ref(false);
const showRegisterPassword = ref(false);
const login = reactive({ email: "ana@carsu.edu.ph", password: "password" });
const register = reactive({ name: "", schoolId: "", email: "", password: "" });

function submitLogin() {
  error.value = "";
  login.email = sanitizeEmail(login.email);
  try {
    if (!isValidEmail(login.email) || !login.password) throw new Error("Enter a valid email and password.");
    store.login(login.email, login.password, "user");
    router.push("/home");
  } catch (err) {
    error.value = err.message;
  }
}

function submitRegister() {
  error.value = "";
  register.name = sanitizeText(register.name, 120);
  register.schoolId = sanitizeText(register.schoolId, 40);
  register.email = sanitizeEmail(register.email);
  if (!register.name || !isValidSchoolId(register.schoolId) || !isValidEmail(register.email) || !isStrongPassword(register.password)) {
    error.value = "School ID must be in format 211-00087. Password must be 8+ chars with uppercase, lowercase, and number.";
    return;
  }
  try {
    store.register({ ...register });
    router.push("/home");
  } catch (err) {
    error.value = err.message;
  }
}
</script>

<template>
  <main class="grid min-h-screen bg-light lg:grid-cols-[1fr_520px]">
    <section class="flex items-center bg-gradient-to-br from-primary via-secondary to-accent px-6 py-12 text-white lg:px-16">
      <div class="mx-auto max-w-xl text-center">
        <div class="mb-2 flex justify-center">
          <img src="/cc-logo.light-large.png" alt="Campus Connect" class="h-24 w-auto object-contain" />
        </div>
        <p class="mt-5 text-lg text-white/90">
          <i>Report, browse, and claim lost or found items in one place.</i>
        </p>
      </div>
    </section>
    <section class="flex items-center justify-center px-5 py-10">
      <div class="w-full max-w-md rounded-md bg-white p-6 shadow-soft">
        <div class="grid grid-cols-2 rounded-md bg-light p-1">
          <button class="rounded-md px-4 py-2 font-semibold" :class="tab === 'login' ? 'bg-white text-primary shadow' : 'text-muted'" @click="tab = 'login'">Login</button>
          <button class="rounded-md px-4 py-2 font-semibold" :class="tab === 'register' ? 'bg-white text-primary shadow' : 'text-muted'" @click="tab = 'register'">Register</button>
        </div>
        <form v-if="tab === 'login'" class="mt-6 space-y-4" @submit.prevent="submitLogin">
          <label class="block"><span class="label">School email</span><input v-model="login.email" class="field mt-1" type="email" /></label>
          <label class="block">
            <span class="label">Password</span>
            <div class="relative mt-1">
              <input v-model="login.password" class="field pr-11" :type="showLoginPassword ? 'text' : 'password'" />
              <button class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-light" type="button" @click="showLoginPassword = !showLoginPassword">
                <EyeOff v-if="showLoginPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </label>
          <p v-if="error" class="text-sm text-danger">{{ error }}</p>
          <button class="btn-primary w-full">Login</button>
          <RouterLink class="block text-center text-sm font-semibold text-primary" to="/admin">Admin login</RouterLink>
        </form>
        <form v-else class="mt-6 space-y-4" @submit.prevent="submitRegister">
          <label class="block"><span class="label">Name</span><input v-model="register.name" class="field mt-1" /></label>
          <label class="block"><span class="label">School ID</span><input v-model="register.schoolId" class="field mt-1" placeholder="211-00087" /></label>
          <label class="block"><span class="label">School email</span><input v-model="register.email" class="field mt-1" type="email" /></label>
          <label class="block">
            <span class="label">Password</span>
            <div class="relative mt-1">
              <input v-model="register.password" class="field pr-11" :type="showRegisterPassword ? 'text' : 'password'" />
              <button class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-light" type="button" @click="showRegisterPassword = !showRegisterPassword">
                <EyeOff v-if="showRegisterPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <span class="mt-1 block text-xs text-muted">At least 8 characters with uppercase, lowercase, and number.</span>
          </label>
          <p v-if="error" class="text-sm text-danger">{{ error }}</p>
          <button class="btn-primary w-full">Create Account</button>
        </form>
      </div>
    </section>
  </main>
</template>
