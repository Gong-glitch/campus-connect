<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "Confirm action" },
  message: { type: String, default: "Are you sure?" }
});
defineEmits(["cancel", "confirm"]);
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-md rounded-md bg-white p-6 shadow-soft">
      <h2 class="text-xl font-bold text-dark">{{ title }}</h2>
      <p class="mt-2 text-sm text-muted">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-2">
        <button class="btn-secondary" type="button" @click="$emit('cancel')">Cancel</button>
        <button class="btn-danger" type="button" @click="$emit('confirm')">Confirm</button>
      </div>
    </div>
  </div>
</template>
