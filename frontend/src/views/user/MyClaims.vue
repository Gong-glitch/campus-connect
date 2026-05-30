<script setup>
import { computed, onMounted, ref } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue"; 
import { useStore } from "../../composables/useStore";
import { Clock, CheckCircle, XCircle, Inbox } from "lucide-vue-next";

const store = useStore();
const { state } = store;

const isLoading = ref(false);
const fetchError = ref("");

// 🚀 AUTOMATIC API TRIGGER: Pulls live records over the network immediately on load
onMounted(async () => {
  try {
    isLoading.value = true;
    fetchError.value = "";

    // Dynamically look for whichever fetch method exists in your central store
    if (typeof store.fetchMyClaims === "function") {
      await store.fetchMyClaims();
    } else if (typeof store.fetchClaims === "function") {
      await store.fetchClaims();
    }
  } catch (err) {
    fetchError.value = "Unable to sync claims from database.";
    console.error("API Fetch Error:", err);
  } finally {
    isLoading.value = false;
  }
});

// Filter rows in the claims table belonging only to the currently logged-in student
const myClaims = computed(() => {
  const currentUserId = state.session?.id;
  // Fallback to an empty array safely if claims state isn't initialized yet
  const allClaims = state.claims || []; 

  return allClaims.filter(
    (claim) =>
      claim.user_id === currentUserId ||
      claim.schoolId === state.session?.schoolId
  );
});
</script>

<template>
  <AppNavbar role="user" />

  <main class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

    <section class="rounded-md bg-gradient-to-r from-primary to-secondary p-8 text-white shadow-soft">
      <h1 class="max-w-3xl text-4xl font-bold">My Filed Claims</h1>
      <p class="mt-3 max-w-2xl text-