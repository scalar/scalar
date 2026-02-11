/**
 * Protocol-specific information for a STOMP server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type StompServerBinding = Record<string, never>

/**
 * Protocol-specific information for a STOMP channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type StompChannelBinding = Record<string, never>
