export default {
  rules: {
    elm: {
      // Only allow one <svg> node
      svg: 1,
    },
    attr: [
      {
        // Ensure that the SVG element has the appropriate attributes
        'rule::selector': 'svg',
        // Don't allow extraneous attributes
        'rule::whitelist': true,
        // ViewBox and namespace must be set
        'viewBox': true,
        'xmlns': 'http://www.w3.org/2000/svg',
        // Allow fill and stroke properties
        'fill?': ['currentColor', 'none'],
        'stroke?': 'currentColor',
        'stroke-linecap?': 'round',
        'stroke-linejoin?': 'round',
        // Make sure to not override stroke width
        'stroke-width': false,
        // Make sure the svg is responsive
        'width': false,
        'height': false,
      },
    ],
  },
}
