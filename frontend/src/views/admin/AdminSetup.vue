<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";
import { isValidEmail, isStrongPassword, sanitizeEmail, sanitizeText } from "../../utils/inputProtection";
import { Eye, EyeOff } from "lucide-vue-next";

const store = useStore();
const router = useRouter();
const error = ref("");
const showPassword = ref(false);
const showConfirm = ref(false);

// ✅ FIXED: All fields start completely empty and clean
const form = reactive({ name: "", schoolId: "", email: "", password: "", confirm: "" });

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
    const schoolId = sanitizeText(form.schoolId, 40); // ✅ Captures your custom input
    const email = sanitizeEmail(form.email);
    const password = String(form.password ?? "");

    if (!name) throw new Error("Name is required.");
    if (!schoolId) throw new Error("School ID is required."); // ✅ Dynamic validation
    if (!isValidEmail(email)) throw new Error("Enter a valid email address.");
    if (!isStrongPassword(password)) throw new Error("Password must be at least 8 characters with uppercase, lowercase, and a number.");
    if (password !== form.confirm) throw new Error("Passwords do not match.");
    if (store.state.users.some((u) => u.email === email)) throw new Error("An account with this email already exists.");

    store.state.users.push({
      id: crypto.randomUUID(),
      name,
      email,
      password,
      schoolId, // ✅ FIXED: Uses your typed value, no longer a random placeholder!
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
        <label class="block">
          <span class="label">Full Name</span>
          <input v-model="form.name" class="field mt-1" type="text" placeholder="John Doe" required />
        </label>

        <label class="block">
          <span class="label">School ID</span>
          <input v-model="form.schoolId" class="field mt-1" type="text" placeholder="211-00087" required />
        </label>
        
        <label class="block">
          <span class="label">Email</span>
          <input v-model="form.email" class="field mt-1" type="email" placeholder="admin@carsu.edu.ph" required />
        </label>
        
        <label class="block">
          <span class="label">Password</span>
          <div class="relative mt-1">
            <input 
              v-model="form.password" 
              class="field pr-11" 
              :type="showPassword ? 'text' : 'password'" 
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
        
        <label class="block">
          <span class="label">Confirm Password</span>
          <div class="relative mt-1">
            <input 
              v-model="form.confirm" 
              class="field pr-11" 
              :type="showConfirm ? 'text' : 'password'" 
              required 
            />
            <button 
              type="button" 
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-light" 
              @click="showConfirm = !showConfirm"
            >
              <EyeOff v-if="showConfirm" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </label>
      </div>
      
      <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>
      <button class="btn-primary mt-6 w-full">Create Admin Account</button>
    </form>
  </main>
</template>