/** Deterministic fixture that exposes accidental repeated schema expansion. */
export const sharedDocument = (operations = 60, properties = 100): Record<string, unknown> => ({
  asyncapi: '3.1.0',
  info: { title: 'Shared event schemas', version: '1.0.0' },
  channels: { events: { address: 'events', messages: { event: { $ref: '#/components/messages/Event' } } } },
  operations: Object.fromEntries(
    Array.from({ length: operations }, (_, index) => [
      `receive${index}`,
      { action: 'receive', channel: { $ref: '#/channels/events' }, tags: [{ name: 'Events' }] },
    ]),
  ),
  components: {
    messages: { Event: { payload: { $ref: '#/components/schemas/Event' } } },
    schemas: {
      Event: {
        type: 'object',
        properties: Object.fromEntries(
          Array.from({ length: properties }, (_, index) => [
            `field${index}`,
            { type: 'string', description: `Event field ${index}.` },
          ]),
        ),
      },
    },
  },
})
