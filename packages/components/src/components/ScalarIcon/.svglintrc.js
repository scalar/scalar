export default {
  rules: {
    elm: {
      // Only allow one <svg> node
      svg: 1,
      // Don't allow certain elements
      clipPath: false,
      desc: false,
      g: false,
    },
    attr: [
      {
        // Ensure that the SVG element has the appropriate attributes
        'rule::selector': 'svg',
        // Don't allow extraneous attributes
        'rule::whitelist': true,
        // ViewBox and namespace must be set
        'viewBox': /^0 0 \d+ \d+$/,
        'xmlns': 'http://www.w3.org/2000/svg',
        // Require fill property
        'fill': true,
        // Allow stroke properties
        'stroke?': true,
        'stroke-linecap?': true,
        'stroke-linejoin?': true,
        // Make sure the svg is responsive
        'width': false,
        'height': false,
      },
      {
        // Require fills to be `none` or `currentColor`
        'rule::selector': '[fill]',
        'fill': ['currentColor', 'none'],
      },
      {
        // Require stroke properties to be set if stroke is set
        'rule::selector': '[stroke]',
        'stroke': 'currentColor',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        // Make sure to not override stroke width
        'stroke-width': false,
      },
    ],
  },
}
