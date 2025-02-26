<template>
  <div class="section-container"><slot /></div>
</template>
<style scoped>
.section-container {
  position: relative;
  padding: 0 60px;
  width: 100%;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
.section-container:has(.introduction-section) {
  border-top: none;
}
@container narrow-references-container (max-width: 900px) {
  .section-container {
    padding: 0;
  }
}
</style>
