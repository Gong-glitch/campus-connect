<script setup>
import { computed, reactive, onMounted } from "vue";
import AppNavbar from "../../components/shared/AppNavbar.vue";
import FilterSidebar from "../../components/shared/FilterSidebar.vue";
import ItemCard from "../../components/shared/ItemCard.vue";
import { useStore } from "../../composables/useStore";

const store = useStore();
const { state } = store;
const filters = reactive({ category: "All", location: "All", from: "", to: "" });

const items = computed(() => state.foundItems.filter((item) =>
  (filters.category === "All" || item.category === filters.category) &&
  (filters.location === "All" || item.location === filters.location) &&
  (!filters.from || item.date >= filters.from) &&
  (!filters.to || item.date <= filters.to)
));

onMounted(() => store.fetchItems());
</script>

<template>
  <AppNavbar role="user" />
  <main class="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[280px_1fr] sm:px-6 lg:px-8">
    <FilterSidebar :filters="filters" :categories="state.settings.categories" :locations="state.settings.locations" />
    <section>
      <h1 class="text-3xl font-bold text-dark">Browse Found Items</h1>
      <div class="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <ItemCard v-for="item in items" :key="item.id" :item="item" />
      </div>
    </section>
  </main>
</template>
