<script setup>
import { computed, reactive, onMounted } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import ItemCard from "../../components/shared/ItemCard.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
const { state } = store;
const filters = reactive({ search: "", category: "All" });

const items = computed(() =>
  state.foundItems.filter((item) => {
    const matchesSearch = !filters.search || item.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === "All" || item.category === filters.category;
    return matchesSearch && matchesCategory;
  })
);

const totalItems = computed(() => state.foundItems.length);
const recoveredItems = computed(() => state.foundItems.filter((i) => i.status === "Claimed").length);

onMounted(() => store.fetchItems());
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <section v-if="state.settings.announcementEnabled" class="rounded-md bg-red-700 px-5 py-3 text-sm font-semibold text-white">
      {{ state.settings.announcementText }}
    </section>
    <section class="rounded-md bg-gradient-to-r from-primary to-secondary p-8 text-white shadow-soft">
      <h1 class="max-w-3xl text-4xl font-bold">Lost something? Found something? We've got you.</h1>
      <p class="mt-3 max-w-2xl text-white/85">Browse found items or submit a report so people can recover belongings faster.</p>
    </section>
    <section class="grid gap-4 md:grid-cols-2">
      <RouterLink to="/report-lost" class="rounded-md bg-white p-6 shadow-soft transition hover:-translate-y-1">
        <h2 class="text-xl font-bold text-dark">Report Lost Item</h2>
        <p class="mt-2 text-muted">Create a lost item record with contact details.</p>
      </RouterLink>
      <RouterLink to="/report-found" class="rounded-md bg-white p-6 shadow-soft transition hover:-translate-y-1">
        <h2 class="text-xl font-bold text-dark">Report Found Item</h2>
        <p class="mt-2 text-muted">Turn over a found item to the campus listing.</p>
      </RouterLink>
    </section>
    <section class="grid gap-4 rounded-md bg-white p-4 shadow-soft md:grid-cols-[1fr_auto]">
      <input v-model="filters.search" class="field" placeholder="Search found items" />
      <div class="flex flex-wrap gap-2">
        <button v-for="category in ['All', ...state.settings.categories]" :key="category" class="rounded-md px-3 py-2 text-sm font-semibold" :class="filters.category === category ? 'bg-primary text-white' : 'bg-light text-primary'" @click="filters.category = category">{{ category }}</button>
      </div>
    </section>
    <section class="grid gap-4 rounded-md bg-white p-5 shadow-soft sm:grid-cols-2">
      <p><span class="text-2xl font-bold text-primary">{{ totalItems }}</span><br /><span class="text-sm text-muted">items this month</span></p>
      <p><span class="text-2xl font-bold text-primary">{{ recoveredItems }}</span><br /><span class="text-sm text-muted">recovered items</span></p>
    </section>
    <section>
      <h2 class="mb-4 text-2xl font-bold text-dark">Found items</h2>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ItemCard v-for="item in items" :key="item.id" :item="item" />
      </div>
    </section>
  </main>
</template>
