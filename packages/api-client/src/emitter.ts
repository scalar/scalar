import mitt, { type Emitter } from 'mitt'

type Events = {
  'click.generated.parameter': undefined
}

/**
 * mitt is a super light-weight global event bus. You can use it to send events between components.
 *
 * Note: Don’t use it too much, though. It can make your code harder to understand.
 */
export const emitter: Emitter<Events> = mitt<Events>()
