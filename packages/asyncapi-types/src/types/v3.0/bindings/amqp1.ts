/**
 * Protocol-specific information for an AMQP 1.0 server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type Amqp1ServerBinding = Record<string, never>

/**
 * Protocol-specific information for an AMQP 1.0 channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type Amqp1ChannelBinding = Record<string, never>
