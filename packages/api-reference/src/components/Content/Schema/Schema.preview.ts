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
      type: 'object',
      properties: {
        foobar: {
          type: 'object',
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
    },
  },
}

export const complexArrayDiscriminatorSchema = {
  component: Schema,
  props: {
    name: 'ComplexArrayDiscriminator',
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
                'type': 'object',
                oneOf: [
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

export const arrayValidationSchema = {
  component: Schema,
  props: {
    name: 'ArrayValidation',
    noncollapsible: true,
    value: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          description: 'A list of tags with validation constraints',
          minItems: 1,
          maxItems: 5,
          uniqueItems: true,
          items: {
            type: 'string',
            minLength: 2,
            maxLength: 20,
            pattern: '^[a-zA-Z0-9-]+$',
          },
        },
        scores: {
          type: 'array',
          description: 'Array of numeric scores between 0 and 100',
          items: {
            type: 'number',
            minimum: 0,
            maximum: 100,
          },
        },
      },
    },
  },
}

export const advancedStringFormatsSchema = {
  component: Schema,
  props: {
    name: 'StringFormats',
    noncollapsible: true,
    value: {
      type: 'object',
      required: ['email', 'website'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'User email address',
          example: 'user@example.com',
        },
        website: {
          type: 'string',
          format: 'uri',
          description: 'Website URL',
          example: 'https://example.com',
        },
        dateOfBirth: {
          type: 'string',
          format: 'date',
          description: 'Date of birth in ISO 8601 format',
          example: '1990-01-01',
        },
        phoneNumber: {
          type: 'string',
          pattern: '^\\+[1-9]\\d{1,14}$',
          description: 'Phone number in E.164 format',
          example: '+12125551234',
        },
      },
    },
  },
}

export const oneOfCombinedSchema = {
  component: Schema,
  props: {
    name: 'PaymentMethod',
    noncollapsible: true,
    value: {
      type: 'object',
      required: ['type'],
      properties: {
        type: {
          type: 'string',
          enum: ['credit_card', 'bank_transfer', 'crypto'],
          description: 'The type of payment method',
        },
      },
      oneOf: [
        {
          type: 'object',
          required: ['card_number', 'expiry_date', 'cvv'],
          properties: {
            type: { enum: ['credit_card'] },
            card_number: {
              type: 'string',
              pattern: '^[0-9]{16}$',
              description: 'Credit card number',
            },
            expiry_date: {
              type: 'string',
              pattern: '^(0[1-9]|1[0-2])/[0-9]{2}$',
              description: 'Card expiry date (MM/YY)',
            },
            cvv: {
              type: 'string',
              pattern: '^[0-9]{3,4}$',
              description: 'Card verification value',
            },
          },
        },
        {
          type: 'object',
          required: ['account_number', 'routing_number'],
          properties: {
            type: { enum: ['bank_transfer'] },
            account_number: {
              type: 'string',
              minLength: 8,
              maxLength: 12,
            },
            routing_number: {
              type: 'string',
              pattern: '^[0-9]{9}$',
            },
          },
        },
        {
          type: 'object',
          required: ['wallet_address'],
          properties: {
            type: { enum: ['crypto'] },
            wallet_address: {
              type: 'string',
              minLength: 26,
              maxLength: 35,
            },
            network: {
              type: 'string',
              enum: ['bitcoin', 'ethereum'],
            },
          },
        },
      ],
    },
  },
}

export const conditionalFieldsSchema = {
  component: Schema,
  props: {
    name: 'ShippingDetails',
    noncollapsible: true,
    value: {
      type: 'object',
      required: ['shippingType'],
      properties: {
        shippingType: {
          type: 'string',
          enum: ['domestic', 'international'],
          description: 'Type of shipping',
        },
        zipCode: {
          type: 'string',
          pattern: '^[0-9]{5}(-[0-9]{4})?$',
          description: 'US ZIP code',
        },
        countryCode: {
          type: 'string',
          pattern: '^[A-Z]{2}$',
          description: 'ISO 3166-1 alpha-2 country code',
        },
      },
      dependencies: {
        shippingType: {
          oneOf: [
            {
              properties: {
                shippingType: { enum: ['domestic'] },
                zipCode: { type: 'string' },
              },
              required: ['zipCode'],
            },
            {
              properties: {
                shippingType: { enum: ['international'] },
                countryCode: { type: 'string' },
              },
              required: ['countryCode'],
            },
          ],
        },
      },
    },
  },
}

export const advancedNumberValidationSchema = {
  component: Schema,
  props: {
    name: 'ProductSpecification',
    noncollapsible: true,
    value: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
          minimum: 0,
          exclusiveMinimum: true,
          maximum: 1000,
          multipleOf: 0.1,
          description: 'Weight in kilograms (up to 1 decimal place)',
        },
        dimensions: {
          type: 'object',
          properties: {
            length: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Length in centimeters',
            },
            width: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Width in centimeters',
            },
            height: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Height in centimeters',
            },
          },
          required: ['length', 'width', 'height'],
        },
        rating: {
          type: 'number',
          minimum: 0,
          maximum: 5,
          multipleOf: 0.5,
          description: 'Product rating (0-5 stars, in 0.5 increments)',
        },
      },
    },
  },
}

export const nestedArrayTupleSchema = {
  component: Schema,
  props: {
    name: 'ChessGame',
    noncollapsible: true,
    value: {
      type: 'object',
      properties: {
        gameId: {
          type: 'string',
          format: 'uuid',
          description: 'Unique identifier for the chess game',
        },
        moves: {
          type: 'array',
          description: 'List of moves in the game',
          items: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            description: 'Move tuple [piece, from, to]',
            items: [
              {
                type: 'string',
                enum: ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'],
                description: 'Chess piece type',
              },
              {
                type: 'string',
                pattern: '^[a-h][1-8]$',
                description: 'Starting position (e.g., "e2")',
              },
              {
                type: 'string',
                pattern: '^[a-h][1-8]$',
                description: 'Ending position (e.g., "e4")',
              },
            ],
          },
        },
        timestamps: {
          type: 'array',
          description: 'Timestamps for each move',
          items: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      required: ['gameId', 'moves'],
    },
  },
}
