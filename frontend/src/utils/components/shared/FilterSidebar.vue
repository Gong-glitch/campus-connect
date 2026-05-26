<script setup>
import { SlidersHorizontal } from "lucide-vue-next";
import { ref } from "vue";

defineProps({
  filters: { type: Object, required: true },
  categories: { type: Array, required: true },
  locations: { type: Array, required: true }
});

const open = ref(false);
</script>

<template>
  <aside class="rounded-md border border-green-100 bg-white p-4 shadow-soft">
    <button class="flex w-full items-center justify-between text-left font-semibold text-dark md:hidden" type="button" @click="open = !open">
      Filters
      <SlidersHorizontal class="h-5 w-5 text-primary" />
    </button>
    <div class="mt-4 space-y-5 md:mt-0" :class="open ? 'block' : 'hidden md:block'">
      <label class="block">
        <span class="label">Category</span>
        <select v-model="filters.category" class="field mt-1">
          <option>All</option>
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>
      </label>
      <label class="block">
        <span class="label">Campus Location</span>
        <select v-model="filters.location" class="field mt-1">
          <option>All</option>
          <option v-for="location in locations" :key="location">{{ location }}</option>
        </select>
      </label>
      <label class="block">
        <span class="label">Date From</span>
        <input v-model="filters.from" class="field mt-1" type="date" />
      </label>
      <label class="block">
        <span class="label">Date To</span>
        <input v-model="filters.to" class="field mt-1" type="date" />
      </label>
    </div>
  </aside>
</template>
