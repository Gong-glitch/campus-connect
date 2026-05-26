<script setup>
import { Menu, X } from "lucide-vue-next";
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useStore } from "../../composables/useStore";

const props = defineProps({ role: { type: String, default: "user" } });
const open = ref(false);
const router = useRouter();
const store = useStore();

const userLinks = [
  ["/home", "Home"],
  ["/browse", "Browse"],
  ["/report-lost", "Report Lost"],
  ["/report-found", "Report Found"],
  ["/my-reports", "My Reports"]
];

const adminLinks = [
  ["/admin/dashboard", "Dashboard"],
  ["/admin/items", "Items"],
  ["/admin/lost-reports", "Lost Reports"],
  ["/admin/claims", "Claims"],
  ["/admin/users", "Users"],
  ["/admin/settings", "Settings"]
];

async function logout() {
  await store.logout();
  // Use a hard redirect instead of router.push so the browser discards the
  // cached page from its back/forward cache and the user cannot navigate back.
  window.location.href = props.role === "admin" ? "/admin" : "/login";
}
</script>

<template>
  <nav class="border-t-4 border-primary bg-white shadow-soft">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <RouterLink :to="role === 'admin' ? '/admin/dashboard' : '/home'" class="flex items-center gap-3">
        <img src="/cc-logo.dark.png" alt="Campus Connect" class="h-9 w-auto object-contain" />
      </RouterLink>
      <button class="rounded-md p-2 text-primary lg:hidden" type="button" @click="open = !open">
        <X v-if="open" class="h-6 w-6" />
        <Menu v-else class="h-6 w-6" />
      </button>
      <div class="hidden items-center gap-2 lg:flex">
        <RouterLink
          v-for="[path, label] in role === 'admin' ? adminLinks : userLinks"
          :key="path"
          :to="path"
          class="rounded-md px-3 py-2 text-sm font-semibold text-dark hover:bg-light"
          active-class="bg-light text-primary"
        >
          {{ label }}
        </RouterLink>
        <button class="btn-secondary" type="button" @click="logout">Logout</button>
      </div>
    </div>
    <div v-if="open" class="border-t border-green-100 px-4 pb-4 lg:hidden">
      <RouterLink
        v-for="[path, label] in role === 'admin' ? adminLinks : userLinks"
        :key="path"
        :to="path"
        class="block rounded-md px-3 py-2 text-sm font-semibold text-dark hover:bg-light"
        @click="open = false"
      >
        {{ label }}
      </RouterLink>
      <button class="btn-secondary mt-2 w-full" type="button" @click="logout">Logout</button>
    </div>
  </nav>
</template>
