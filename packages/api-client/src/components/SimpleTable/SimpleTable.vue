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
  border: 1px solid var(--scalar-border-color);
  border-radius: 0 0 var(--scalar-radius) var(--scalar-radius);
  width: 100%;
  overflow: auto;
}
</style>
