<script setup>
import { ArrowUpDown } from "lucide-vue-next";

defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true }
});
</script>

<template>
  <div class="overflow-x-auto rounded-md border border-green-100 bg-white shadow-soft">
    <table class="min-w-full text-left text-sm">
      <thead class="bg-primary text-white">
        <tr>
          <th v-for="column in columns" :key="column.key" class="whitespace-nowrap px-4 py-3 font-semibold">
            <span class="inline-flex items-center gap-1">
              {{ column.label }}
              <ArrowUpDown v-if="column.sortable" class="h-3.5 w-3.5" />
            </span>
          </th>
          <th class="px-4 py-3 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" class="odd:bg-white even:bg-light/40">
          <td v-for="column in columns" :key="column.key" class="whitespace-nowrap px-4 py-3 text-dark">
            <slot :name="column.key" :row="row">{{ row[column.key] }}</slot>
          </td>
          <td class="whitespace-nowrap px-4 py-3">
            <slot name="actions" :row="row" />
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td class="px-4 py-8 text-center text-muted" :colspan="columns.length + 1">No records found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
