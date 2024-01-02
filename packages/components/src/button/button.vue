<script setup lang="ts">
  // import { ref } from 'vue'
</script>

<template>
  <button class="se-btn">
    <slot v-if="$slots.default" />
  </button>
</template>

<style>
.se-btn {
  all: unset;
}
</style>
