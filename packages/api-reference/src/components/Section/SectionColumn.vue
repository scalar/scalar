<script setup lang="ts"></script>

<template>
  <section class="section-column"><slot /></section>
</template>

<style scoped>
.section-column {
  flex: 1;
  min-width: 0;
}
</style>
