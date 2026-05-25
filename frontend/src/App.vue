<script setup>
import { provide } from "vue";
import { RouterView } from "vue-router";
import { appStoreKey, createAppStore } from "./store/appStore";

const store = createAppStore();
provide(appStoreKey, store);
</script>

<template>
  <RouterView />
</template>
