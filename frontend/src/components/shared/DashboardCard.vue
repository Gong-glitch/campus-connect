<script setup>
defineProps({
  icon: { type: Object, required: true },
  number: { type: [String, Number], required: true },
  label: { type: String, required: true }
});
</script>

<template>
  <div class="rounded-md border border-green-100 bg-light p-5 shadow-soft">
    <component :is="icon" class="h-7 w-7 text-primary" />
    <p class="mt-4 text-3xl font-bold text-dark">{{ number }}</p>
    <p class="text-sm font-medium text-muted">{{ label }}</p>
  </div>
</template>
