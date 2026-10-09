<script lang="ts">
/**
 * The "Developer Portals" sticker, artwork only.
 *
 * Extracted from `documentation/assets/remote/sticker-3.svg` (the `docsSticker` group, without the
 * peel wrapper and lighting filters; every printed text is kept) and optimised with
 * `svgo --multipass -p 1` using `preset-default` with `removeViewBox: false` and `cleanupIds: false`.
 * The viewBox is cropped to the artwork's bounding box. Re-export it the same way.
 */
export default {}
</script>

<template>
  <svg
    aria-hidden="true"
    class="explore-scalar-sticker block h-auto"
    data-sticker="portals"
    fill="none"
    focusable="false"
    viewBox="0 0 113 142"
    xmlns="http://www.w3.org/2000/svg">
    <path
      class="explore-sticker-blue"
      d="M21.2 1.5H92c10.8 0 19.6 8.8 19.6 19.7v99.7c0 10.9-8.9 19.7-19.7 19.6H21a19.6 19.6 0 0 1-19.6-19.6V21c0-10.8 8.9-19.6 19.7-19.6Z"
      fill="#0082d0"
      stroke="#dcdcdc"
      stroke-width="3" />
    <text
      fill="#fff"
      style="font-size: 14.7547px; font-weight: 800; letter-spacing: -0.02em">
      <tspan
        x="17.7"
        y="96.8">
        Developer
      </tspan>
    </text>
    <text
      fill="#fff"
      style="font-size: 14.5535px; font-weight: 800; letter-spacing: -0.02em">
      <tspan
        x="43.8"
        y="112.1">
        Portals
      </tspan>
    </text>
    <!-- The source sets textLength on the whole paragraph, which browsers apply across all three
         lines at once and squash them; each line carries its share of the 70 unit measure instead -->
    <text
      fill="#dcdcdc"
      style="font-size: 2.83764px; font-weight: 500; letter-spacing: 0.01em"
      transform="translate(15.0137 118.313) rotate(0.696807)">
      <tspan
        lengthAdjust="spacing"
        textLength="70"
        x="0"
        y="2.92363">
        Scalar embraces open standards and makes it easy for you
      </tspan>
      <tspan
        lengthAdjust="spacing"
        textLength="68.8"
        x="0"
        y="6.70715">
        to embrace them too. Join the open-source community and
      </tspan>
      <tspan
        lengthAdjust="spacing"
        textLength="43.8"
        x="0"
        y="10.4907">
        start building on open foundations.
      </tspan>
    </text>
    <path
      d="M72.8 39.7H94q1.3 0 1.7 1.2l.7 2.1q.4 1.6-.3 3.1L80.2 76.8q-.3.6-1 .6l-25.7-.1c-.9 0-1.5-.9-1.1-1.7l5.5-12.2q.4-.6 1-.7l25.9-1c2.5-.9 3.6-6.5 1.6-6.5h-22c-.7 0-2-2.2-1.8-3.4.7-3.2 6.3-11 7.1-14.4.3-1 0-3.4-1-3.4H47.5q-.6 0-1-.7l-.4-.7q-.3-.5 0-1.1l7-11.7q.4-.6 1-.6h25c.5 0 1.1 1.4 1.2 2 .3 4.7-8.2 12.9-7.4 18.5"
      fill="#fff" />
    <path
      d="M38.3 40.3H59q1.2 0 1.7 1.2l.8 2.8q.3 1-.1 1.7L46.6 77.1q-.4.7-1 .7l-24.4.1q-1.3-.2-1-1.5l3.6-12.3q.3-.7 1.1-.8l25.2-1c2.4-1 3.5-6.5 1.6-6.5H30c-.6 0-2-2.2-1.7-3.5.7-3.2 6.2-11 7-14.3.2-1 0-3.5-1-3.5H13.5q-.7 0-1-.6l-.4-.7q-.3-.5 0-1.1L19 20.4q.4-.6 1-.6h23.7q.8 0 1.4.7l.6 1.4c.3 4.6-8 12.8-7.3 18.4"
      fill="#fff" />
    <text
      fill="#fff"
      style="font-size: 3.54646px; font-weight: bold; letter-spacing: 0.09em"
      transform="translate(19.9 12.3)">
      <tspan
        x="0"
        y="3.6">
        WWW.SCALAR.COM
      </tspan>
    </text>
  </svg>
</template>

<style scoped>
/* The printed colours, with the wider-gamut originals where the display can show them */
.explore-sticker-blue {
  fill: #0082d0;
}
@media (color-gamut: p3) {
  .explore-sticker-blue {
    fill: color(display-p3 0 0.509804 0.815686);
  }
}
text {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>
