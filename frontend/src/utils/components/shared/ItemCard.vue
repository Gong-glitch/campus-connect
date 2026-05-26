<script setup>
import { MapPin } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import StatusBadge from "./StatusBadge.vue";

defineProps({ item: { type: Object, required: true } });
</script>

<template>
  <RouterLink
    :to="`/items/${item.id}`"
    class="group overflow-hidden rounded-md border border-green-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
  >
    <img :src="item.photo" :alt="item.name" class="h-44 w-full object-cover" />
    <div class="space-y-3 p-4">
      <div class="flex items-start justify-between gap-2">
        <div>
          <p class="font-semibold text-dark">{{ item.name }}</p>
          <p class="text-sm text-muted">{{ item.category }}</p>
        </div>
        <StatusBadge :status="item.status" />
      </div>
      <div class="flex items-center gap-2 text-sm text-muted">
        <MapPin class="h-4 w-4 text-primary" />
        <span>{{ item.location }}</span>
      </div>
      <p class="text-xs font-semibold text-primary">{{ item.date }}</p>
    </div>
  </RouterLink>
</template>
