/**
 * Identifier Object for SQS.
 */
export type Identifier = {
  /** The target is an ARN. For example, for SQS, the identifier may be an ARN. */
  arn?: string
  /** The endpoint is identified by a name, which corresponds to an identifying field called name of a binding for that protocol on the Operation Object. */
  name?: string
}

/**
 * Statement Object for SQS Policy.
 */
export type Statement = {
  /** Either Allow or Deny. */
  effect: 'Allow' | 'Deny'
  /** The AWS account(s) or resource ARN(s) that the statement applies to. */
  principal: string | Record<string, string | string[]>
  /** The SQS permission being allowed or denied e.g. sqs:SendMessage. */
  action: string | string[]
  /** The resource(s) that this policy applies to. */
  resource?: string | string[]
  /** Specific circumstances under which the policy grants permission. */
  condition?: Record<string, any> | Array<Record<string, any>>
}

/**
 * Policy Object for SQS.
 */
export type Policy = {
  /** An array of Statement objects, each of which controls a permission for this queue. */
  statements: Statement[]
}

/**
 * Redrive Policy Object for SQS.
 */
export type RedrivePolicy = {
  /** The SQS queue to use as a dead letter queue (DLQ). */
  deadLetterQueue: Identifier
  /** The number of times a message is delivered to the source queue before being moved to the dead-letter queue. Default is 10. */
  maxReceiveCount?: number
}

/**
 * Queue Object for SQS.
 */
export type Queue = {
  /** The name of the queue. When an SNS Operation Binding Object references an SQS queue by name, the identifier should be the one in this field. */
  name: string
  /** Is this a FIFO queue? */
  fifoQueue: boolean
  /** Specifies whether message deduplication occurs at the message group or queue level. Valid values are messageGroup and queue. This property applies only to high throughput for FIFO queues. */
  deduplicationScope?: 'messageGroup' | 'queue'
  /** Specifies whether the FIFO queue throughput quota applies to the entire queue or per message group. Valid values are perQueue and perMessageGroupId. This property applies only to high throughput for FIFO queues. */
  fifoThroughputLimit?: 'perQueue' | 'perMessageGroupId'
  /** The number of seconds to delay before a message sent to the queue can be received. Used to create a delay queue. Range is 0 to 15 minutes. Defaults to 0. */
  deliveryDelay?: number
  /** The length of time, in seconds, that a consumer locks a message - hiding it from reads - before it is unlocked and can be read again. Range from 0 to 12 hours (43200 seconds). Defaults to 30 seconds. */
  visibilityTimeout?: number
  /** Determines if the queue uses short polling or long polling. Set to zero (the default) the queue reads available messages and returns immediately. Set to a non-zero integer, long polling waits the specified number of seconds for messages to arrive before returning. */
  receiveMessageWaitTime?: number
  /** How long to retain a message on the queue in seconds, unless deleted. The range is 60 (1 minute) to 1,209,600 (14 days). The default is 345,600 (4 days). */
  messageRetentionPeriod?: number
  /** Prevent poison pill messages by moving un-processable messages to an SQS dead letter queue. */
  redrivePolicy?: RedrivePolicy
  /** The security policy for the SQS Queue. */
  policy?: Policy
  /** Key-value pairs that represent AWS tags on the queue. */
  tags?: Record<string, string>
}

/**
 * Protocol-specific information for an SQS channel.
 */
export type SqsChannelBinding = {
  /** A definition of the queue that will be used as the channel. */
  queue: Queue
  /** A definition of the queue that will be used for un-processable messages. */
  deadLetterQueue?: Queue
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for an SQS operation.
 */
export type SqsOperationBinding = {
  /** Queue objects that are either the endpoint for an SNS Operation Binding Object, or the deadLetterQueue of the SQS Operation Binding Object. */
  queues: Queue[]
  /** The version of this binding. */
  bindingVersion?: string
}
