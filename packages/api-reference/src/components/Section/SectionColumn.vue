<template>
  <div class="section-column"><slot /></div>
</template>

<style scoped>
.section-column {
  flex: 1;
  min-width: 0;
}
@container narrow-references-container (max-width: 900px) {
  .section-column:nth-of-type(2) {
    padding-top: 0;
  }
}
</style>
