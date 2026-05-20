const fillOpts = {
  'fill?': true,
  'fill-rule?': true,
  'clip-rule?': true,
}

const strokeOpts = {
  'stroke?': true,
  'stroke-linecap?': true,
  'stroke-linejoin?': true,
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
        // Ensure that path elements have the appropriate attributes
        'rule::selector': 'path',
        // Don't allow extraneous attributes
        'rule::whitelist': true,
        // Require a path definition
        'd': true,
        // Allow fill and stroke properties
        ...fillOpts,
        ...strokeOpts,
      },
      {
        // Ensure that circle elements have the appropriate attributes
        'rule::selector': 'circle',
        // Don't allow extraneous attributes
        'rule::whitelist': true,
        // Require a circle definition
        'cx': true,
        'cy': true,
        'r': true,
        // Allow fill and stroke properties
        ...fillOpts,
        ...strokeOpts,
      },
      {
        // Ensure that rectangle elements have the appropriate attributes
        'rule::selector': 'rect',
        // Don't allow extraneous attributes
        'rule::whitelist': true,
        // Require a rectangle definition
        'x': true,
        'y': true,
        'width': true,
        'height': true,
        // Allow fill and stroke properties
        ...fillOpts,
        ...strokeOpts,
      },
      {
        // Require fills to be either `none` or `currentColor`
        'rule::selector': '[fill]',
        'fill': ['currentColor', 'none'],
      },
      {
        // Require stroke properties to be set if stroke is set
        'rule::selector': '[stroke]',
        'stroke': 'currentColor',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      {
        // Make sure to not override stroke width
        'rule::selector': '*',
        'stroke-width': false,
      },
    ],
  },
}
