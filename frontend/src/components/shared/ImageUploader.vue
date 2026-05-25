<script setup>
import { Upload } from "lucide-vue-next";
import { ref } from "vue";

const model = defineModel({ type: String, default: "" });
const preview = ref(model.value);

function setFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    preview.value = reader.result;
    model.value = reader.result;
  };
  reader.readAsDataURL(file);
}
</script>

<template>
  <label
    class="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-accent bg-light/60 p-4 text-center transition hover:bg-light"
    @dragover.prevent
    @drop.prevent="setFile($event.dataTransfer.files[0])"
  >
    <img v-if="preview" :src="preview" alt="Preview" class="max-h-36 rounded-md object-cover" />
    <template v-else>
      <Upload class="h-8 w-8 text-primary" />
      <span class="mt-2 text-sm font-semibold text-primary">Upload or drag photo</span>
      <span class="text-xs text-muted">Optional image preview</span>
    </template>
    <input class="hidden" type="file" accept="image/*" @change="setFile($event.target.files[0])" />
  </label>
</template>
