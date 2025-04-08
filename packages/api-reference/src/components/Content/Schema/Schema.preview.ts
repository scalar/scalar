import Schema from './Schema.vue'

export const stringSchema = {
  component: Schema,
  noncollapsible: true,
  props: {
    name: 'CustomString',
    noncollapsible: true,
    value: {
      type: 'string',
      example: 'Hello, world!',
    },
  },
}

export const objectSchema = {
  component: Schema,
  noncollapsible: true,
  props: {
    name: 'CustomObject',
    noncollapsible: true,
    value: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        age: {
          type: 'number',
          example: 30,
        },
      },
    },
  },
}

const objectWithCircularReference = {
  type: 'object',
  properties: {
    circularReference: {},
  },
}

objectWithCircularReference.properties.circularReference = objectWithCircularReference

export const recursiveSchema = {
  component: Schema,
  props: {
    name: 'CustomRecursive',
    noncollapsible: true,
    value: objectWithCircularReference,
  },
}

export const enumSchema = {
  component: Schema,
  props: {
    name: 'CustomEnum',
    noncollapsible: true,
    value: {
      type: 'string',
      enum: ['foo', 'bar'],
      description: 'The enum value',
    },
  },
}

export const objectWithEnumSchema = {
  component: Schema,
  props: {
    name: 'ObjectWithEnum',
    noncollapsible: true,
    value: {
      type: 'object',
      properties: {
        enumValue: {
          type: 'string',
          enum: ['foo', 'bar'],
          description: 'The enum value',
        },
      },
    },
  },
}

export const discriminatorsSchema = {
  component: Schema,
  props: {
    name: 'CustomDiscriminator',
    noncollapsible: true,
    value: {
      anyOf: [
        {
          name: 'Foo',
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['foo'] },
            fooProperty: { type: 'string' },
          },
        },
        {
          name: 'Bar',
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['bar'] },
            barProperty: { type: 'number' },
          },
        },
      ],
    },
  },
}

export const complexAllOfSchema = {
  component: Schema,
  props: {
    name: 'ComplexAllOf',
    noncollapsible: true,
    value: {
      allOf: [
        {
          'type': 'object',
          'properties': {
            'top-level-property': {
              'type': 'string',
            },
          },
        },
        {
          'type': 'object',
          'properties': {
            'top-level-array': {
              'type': 'array',
              'items': {
                'allOf': [
                  {
                    'type': 'object',
                    'properties': {
                      'all-of-schema-1': {
                        'type': 'string',
                      },
                    },
                  },
                  {
                    'type': 'object',
                    'allOf': [
                      {
                        'type': 'object',
                        'properties': {
                          'all-of-schema-2': {
                            'type': 'array',
                            'items': {
                              'allOf': [
                                {
                                  'type': 'object',
                                  'properties': {
                                    'all-of-schema-2-items-all-of-schema-1': {
                                      'type': 'string',
                                    },
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ],
    },
  },
}
