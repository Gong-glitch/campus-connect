<script setup>
defineProps({ items: { type: Array, required: true } });
</script>

<template>
  <div class="rounded-md border border-green-100 bg-white p-5 shadow-soft">
    <h2 class="text-lg font-bold text-dark">Recent Activity</h2>
    <div class="mt-4 space-y-4 border-l-4 border-accent pl-4">
      <div v-for="item in items" :key="item.id">
        <p class="font-semibold text-dark">{{ item.text }}</p>
        <p class="text-xs text-muted">{{ item.time }}</p>
      </div>
    </div>
  </div>
</template>
