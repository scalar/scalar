<template>
  <div class="requestApproved">
    <svg
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        height="14.25"
        rx="7.125"
        width="14.25"
        x="0.875"
        y="0.875" />
      <rect
        height="14.25"
        rx="7.125"
        stroke="var(--scalar-color-green)"
        stroke-width="1.75"
        width="14.25"
        x="0.875"
        y="0.875" />
      <g clip-path="url(#clip0_74_840)">
        <path
          d="M11.6037 6.841L7.59117 10.8535C7.49742 10.9472 7.37029 10.9998 7.23774 10.9998C7.10519 10.9998 6.97806 10.9472 6.8843 10.8535L4.64617 8.6035C4.55257 8.50975 4.5 8.38269 4.5 8.25022C4.5 8.11774 4.55257 7.99068 4.64617 7.89694L5.27117 7.27194C5.36488 7.17862 5.49174 7.12623 5.62399 7.12623C5.75623 7.12623 5.88309 7.17862 5.9768 7.27194L7.25024 8.50694L10.274 5.52037C10.3677 5.42696 10.4946 5.37451 10.627 5.37451C10.7593 5.37451 10.8862 5.42696 10.9799 5.52037L11.6034 6.131C11.6502 6.17746 11.6875 6.23274 11.7129 6.29366C11.7383 6.35458 11.7514 6.41993 11.7514 6.48593C11.7514 6.55194 11.7384 6.6173 11.713 6.67824C11.6877 6.73918 11.6505 6.7945 11.6037 6.841Z"
          fill="var(--scalar-color-green)" />
      </g>
      <defs>
        <clipPath id="clip0_74_840">
          <rect
            height="8"
            rx="4"
            width="8"
            x="4"
            y="4" />
        </clipPath>
      </defs>
    </svg>
    Request Approved
  </div>
</template>

<style scoped>
.requestApproved {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--scalar-color-green);
  font-weight: var(--scalar-semibold);
  min-height: 40px;
  font-size: var(--scalar-font-size-3);
  position: relative;
}
</style>
