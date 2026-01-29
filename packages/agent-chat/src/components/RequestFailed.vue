<template>
  <div class="requestFailed">
    <i class="requestFailedIcon">
      <svg
        fill="currentColor"
        height="100%"
        viewBox="0 0 256 256"
        width="100%"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M216,48V208a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h40A16,16,0,0,1,216,48ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z"></path>
      </svg>
    </i>
    Request Failed
  </div>
</template>

<style scoped>
.requestFailed {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--scalar-color-red);
  font-weight: var(--scalar-semibold);
  min-height: 40px;
  font-size: var(--scalar-font-size-3);
  position: relative;
}
.requestFailedIcon {
  box-shadow: inset 0 0 0 1.5px currentColor;
  padding: 4px;
  padding: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
</style>
