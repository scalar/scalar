<script setup lang="ts"></script>

<template>
  <div class="section-container"><slot /></div>
</template>

<style scoped>
.section-container {
  position: relative;
  padding: 0 60px;
  width: 100%;
}

.references-narrow .section-container {
  padding: 0 30px !important;
}

.section-container:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
/*

.reference .reference-container {
  position: relative;
  display: flex;
  gap: 48px;

  max-width: 1120px;
  margin: auto;
  padding: 90px 0;
}

.reference-container + .reference-container {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.reference-container .copy,
.reference-container .example {
  flex: 1;
  min-width: 0;
} */
</style>
