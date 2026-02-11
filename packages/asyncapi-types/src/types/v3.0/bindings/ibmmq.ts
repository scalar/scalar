/**
 * Protocol-specific information for an IBM MQ server.
 */
export type IbmMqServerBinding = {
  /** Defines a logical group of IBM MQ server objects. This is necessary to specify multi-endpoint configurations used in high availability deployments. */
  groupId?: string
  /** The name of the IBM MQ queue manager to bind to in the CCDT file. */
  ccdtQueueManagerName?: string
  /** The recommended cipher specification used to establish a TLS connection between the client and the IBM MQ queue manager. */
  cipherSpec?: string
  /** If multiEndpointServer is true then multiple connections can be workload balanced and applications should not make assumptions as to where messages are processed. */
  multiEndpointServer?: boolean
  /** The recommended value (in seconds) for the heartbeat sent to the queue manager during periods of inactivity. A value of zero means that no heart beats are sent. A value of 1 means that the client will use the value defined by the queue manager. */
  heartBeatInterval?: number
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Queue Object for IBM MQ.
 */
export type Queue = {
  /** Defines the name of the IBM MQ queue associated with the channel. */
  objectName: string
  /** Defines if the queue is a cluster queue and therefore partitioned. If true, a binding option MAY be specified when accessing the queue. */
  isPartitioned?: boolean
  /** Specifies if it is recommended to open the queue exclusively. */
  exclusive?: boolean
}

/**
 * Topic Object for IBM MQ.
 */
export type Topic = {
  /** The value of the IBM MQ topic string to be used. */
  string?: string
  /** The name of the IBM MQ topic object. */
  objectName?: string
  /** Defines if the subscription may be durable. */
  durablePermitted?: boolean
  /** Defines if the last message published will be made available to new subscriptions. */
  lastMsgRetained?: boolean
}

/**
 * Protocol-specific information for an IBM MQ channel.
 */
export type IbmMqChannelBinding = {
  /** Defines the type of AsyncAPI channel. MUST be either topic or queue. */
  destinationType?: 'topic' | 'queue'
  /** Defines the properties of a queue. */
  queue?: Queue
  /** Defines the properties of a topic. */
  topic?: Topic
  /** The maximum length of the physical message (in bytes) accepted by the Topic or Queue. Messages produced that are greater in size than this value may fail to be delivered. */
  maxMsgLength?: number
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for an IBM MQ message.
 */
export type IbmMqMessageBinding = {
  /** The type of the message. MUST be either string, jms, or binary. */
  type?: 'string' | 'jms' | 'binary'
  /** Defines the IBM MQ message headers to include with this message. More than one header can be specified as a comma separated list. */
  headers?: string
  /** Provides additional information for application developers: describes the message type or format. */
  description?: string
  /** The recommended setting the client should use for the TTL (Time-To-Live) of the message. This is a period of time expressed in milliseconds. */
  expiry?: number
  /** The version of this binding. */
  bindingVersion?: string
}
