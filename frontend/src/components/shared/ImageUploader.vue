<script setup>
import { Loader2, Upload, X } from "lucide-vue-next";
import { ref, watch } from "vue";
import { api } from "../../services/api";

const model = defineModel({ type: String, default: "" });
const preview = ref("");
const uploading = ref(false);
const error = ref("");

// 🖼️ DYNAMIC PREVIEW CLEANING ENGINE
// Formats raw backend database relative strings into live asset stream links
function formatStorageUrl(pathString) {
  if (!pathString) return "";
  if (pathString.startsWith("data:") || pathString.startsWith("http")) return pathString;

  let cleanPath = pathString.trim().replace(/^\//, "");

  if (cleanPath.startsWith("public/storage/")) {
    cleanPath = cleanPath.substring(15);
  } else if (cleanPath.startsWith("storage/")) {
    cleanPath = cleanPath.substring(8);
  } else if (cleanPath.startsWith("app/public/")) {
    cleanPath = cleanPath.substring(11);
  }

  return `https://campus-connect-api-0s3b.onrender.com/api/storage/${cleanPath}`;
}

// Keep the initial view sanitized correctly
if (model.value) {
  preview.value = formatStorageUrl(model.value);
}

watch(() => model.value, (val) => {
  if (val) {
    // Only parse it if it isn't a temporary local FileReader base64 block
    if (!val.startsWith("data:")) {
      preview.value = formatStorageUrl(val);
    }
  } else {
    preview.value = "";
  }
});

async function setFile(file) {
  if (!file) return;
  error.value = "";

  // ⚡ Show local file preview instantly while loading
  const reader = new FileReader();
  reader.onload = (e) => { 
    preview.value = e.target.result; 
  };
  reader.readAsDataURL(file);

  uploading.value = true;
  try {
    const url = await api.upload(file);
    model.value = url;
    preview.value = formatStorageUrl(url);
  } catch (err) {
    error.value = err.message || "Upload failed.";
    preview.value = model.value ? formatStorageUrl(model.value) : "";
  } finally {
    uploading.value = false;
  }
}

function clear() {
  preview.value = "";
  model.value = "";
  error.value = "";
}
</script>

<template>
  <div class="space-y-2">
    <label
      class="relative flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-accent bg-light/60 p-4 text-center transition hover:bg-light"
      :class="{ 'pointer-events-none opacity-60': uploading }"
      @dragover.prevent
      @drop.prevent="setFile($event.dataTransfer.files[0])"
    >
      <img v-if="preview && !uploading" :src="preview" alt="Preview" class="max-h-36 rounded-md object-cover" />

      <template v-else-if="uploading">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <span class="mt-2 text-sm font-semibold text-primary">Uploading…</span>
      </template>

      <template v-else>
        <Upload class="h-8 w-8 text-primary" />
        <span class="mt-2 text-sm font-semibold text-primary">Upload or drag photo</span>
        <span class="text-xs text-muted">JPEG, PNG, WebP — max 4 MB</span>
      </template>

      <input class="hidden" type="file" accept="image/jpeg,image/png,image/gif,image/webp" :disabled="uploading" @change="setFile($event.target.files[0])" />
    </label>

    <div v-if="preview && !uploading" class="flex justify-end">
      <button type="button" class="flex items-center gap-1 text-xs text-danger hover:underline" @click="clear">
        <X class="h-3.5 w-3.5" /> Remove photo
      </button>
    </div>

    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
  </div>
</template>