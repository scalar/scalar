<template>
  <div class="simple-table-container">
    <table class="simple-table">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.simple-table {
  all: unset;
  display: table;
  width: 100%;
}
.simple-table-container {
  border: 0.5px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
  width: 100%;
  overflow: auto;
  margin: 0 18px;
}
</style>
