const strokeOpts = {
  'stroke?': true,
  'stroke-linecap?': true,
  'stroke-linejoin?': true,
  'stroke-width?': true,
}

export default {
  rules: {
    elm: {
      // Only allow one <svg> node
      'svg': 1,
      // Allow up to one <title>
      'title': [0, 1],
      // Allow shape elements
      'path': [0, 999],
      'rect': [0, 999],
      'circle': [0, 999],
      'g': [0, 999],
      // Don't allow other elements
      '*': false,
    },
    attr: [
      {
        // Ensure that the SVG element has the appropriate attributes
        'rule::selector': 'svg',
        // Don't allow extraneous attributes
        'rule::whitelist': true,
        // ViewBox must be square and namespace must be set
        'viewBox': /^0 0 (\d+) \1$/,
        'xmlns': 'http://www.w3.org/2000/svg',
        // Allow fill property on <svg> tag
        'fill?': true,
        // Allow stroke properties
        ...strokeOpts,
        // Make sure the svg is responsive
        'width': false,
        'height': false,
      },
      {
        // Require fills to be either `none` or `currentColor`
        'rule::selector': '[fill]',
        'fill': ['currentColor', 'none'],
      },
      {
        // Require strokes to be `currentColor` if set
        'rule::selector': '[stroke]',
        'stroke': 'currentColor',
      },
    ],
  },
}
