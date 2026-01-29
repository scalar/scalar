<template>
  <div class="autosendPaused">
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
        stroke="currentColor"
        stroke-width="1.5"
        width="14.25"
        x="0.875"
        y="0.875" />
      <g clip-path="url(#clip0_74_585)">
        <path
          d="M10.75 5.5V10.5C10.75 10.6326 10.6973 10.7598 10.6036 10.8536C10.5098 10.9473 10.3826 11 10.25 11H9C8.86739 11 8.74021 10.9473 8.64645 10.8536C8.55268 10.7598 8.5 10.6326 8.5 10.5V5.5C8.5 5.36739 8.55268 5.24021 8.64645 5.14645C8.74021 5.05268 8.86739 5 9 5H10.25C10.3826 5 10.5098 5.05268 10.6036 5.14645C10.6973 5.24021 10.75 5.36739 10.75 5.5ZM7 5H5.75C5.61739 5 5.49021 5.05268 5.39645 5.14645C5.30268 5.24021 5.25 5.36739 5.25 5.5V10.5C5.25 10.6326 5.30268 10.7598 5.39645 10.8536C5.49021 10.9473 5.61739 11 5.75 11H7C7.13261 11 7.25979 10.9473 7.35355 10.8536C7.44732 10.7598 7.5 10.6326 7.5 10.5V5.5C7.5 5.36739 7.44732 5.24021 7.35355 5.14645C7.25979 5.05268 7.13261 5 7 5Z"
          fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip0_74_585">
          <rect
            height="8"
            rx="4"
            width="8"
            x="4"
            y="4" />
        </clipPath>
      </defs>
    </svg>
    Accept Request to Continue
  </div>
</template>

<style scoped>
.autosendPaused {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--scalar-color-blue);
  font-weight: var(--scalar-semibold);
  min-height: 40px;
  font-size: var(--scalar-font-size-3);
  position: relative;
}
</style>
