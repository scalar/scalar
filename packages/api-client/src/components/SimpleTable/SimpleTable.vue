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
  border-right: none;
  border-left: none;
  width: 100%;
  overflow: auto;
}
</style>
