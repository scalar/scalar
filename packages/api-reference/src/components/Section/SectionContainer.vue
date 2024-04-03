<template>
  <div class="section-container"><slot /></div>
</template>

<style scoped>
.section-container {
  position: relative;
  padding: 0 60px;
  width: 100%;
}
.section-container:last-of-type {
  border-top: 1px solid var(--scalar-border-color);
}

@container narrow-references-container (max-width: 900px) {
  .section-container {
    padding: 0;
  }
}
</style>
