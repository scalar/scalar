<template>
  <div class="section-column"><slot /></div>
</template>

<style scoped>
.section-column {
  flex: 1;
  min-width: 0;
}
.section-column:nth-of-type(2) {
  padding-top: 48px;
}
.references-narrow .section-column:nth-of-type(2) {
  padding-top: 0;
}
</style>
