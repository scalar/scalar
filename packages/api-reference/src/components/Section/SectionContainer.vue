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
</style>
