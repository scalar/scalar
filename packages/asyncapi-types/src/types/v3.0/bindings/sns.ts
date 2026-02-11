/**
 * Protocol-specific information for an SNS server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type SnsServerBinding = Record<string, never>

/**
 * Ordering Object for SNS.
 */
export type Ordering = {
  /** Defines the type of SNS Topic. Can be either standard or FIFO. */
  type: 'standard' | 'FIFO'
  /** Whether the de-duplication of messages should be turned on. Defaults to false. */
  contentBasedDeduplication?: boolean
}

/**
 * Statement Object for SNS Policy.
 */
export type Statement = {
  /** Either Allow or Deny. */
  effect: 'Allow' | 'Deny'
  /** The AWS account(s) or resource ARN(s) that the statement applies to. */
  principal: string | Record<string, string | string[]>
  /** The SNS permission being allowed or denied e.g. sns:Publish. */
  action: string | string[]
  /** The resource(s) that this policy applies to. */
  resource?: string | string[]
  /** Specific circumstances under which the policy grants permission. */
  condition?: Record<string, any> | Array<Record<string, any>>
}

/**
 * Policy Object for SNS.
 */
export type Policy = {
  /** An array of Statement objects, each of which controls a permission for this topic. */
  statements: Statement[]
}

/**
 * Protocol-specific information for an SNS channel.
 */
export type SnsChannelBinding = {
  /** The name of the topic. Can be different from the channel name to allow flexibility around AWS resource naming limitations. */
  name: string
  /** By default, we assume an unordered SNS topic. This field allows configuration of a FIFO SNS Topic. */
  ordering?: Ordering
  /** The security policy for the SNS Topic. */
  policy?: Policy
  /** Key-value pairs that represent AWS tags on the topic. */
  tags?: Record<string, string>
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Identifier Object for SNS.
 */
export type Identifier = {
  /** The endpoint is a URL. */
  url?: string
  /** The endpoint is an email address. */
  email?: string
  /** The endpoint is a phone number. */
  phone?: string
  /** The target is an ARN. For example, for SQS, the identifier may be an ARN. */
  arn?: string
  /** The endpoint is identified by a name, which corresponds to an identifying field called name of a binding for that protocol on the Operation Object. */
  name?: string
}

/**
 * Redrive Policy Object for SNS.
 */
export type RedrivePolicy = {
  /** The SQS queue to use as a dead letter queue (DLQ). */
  deadLetterQueue: Identifier
  /** The number of times a message is delivered to the source queue before being moved to the dead-letter queue. Defaults to 10. */
  maxReceiveCount?: number
}

/**
 * Delivery Policy Object for SNS.
 */
export type DeliveryPolicy = {
  /** The minimum delay for a retry in seconds. */
  minDelayTarget?: number
  /** The maximum delay for a retry in seconds. */
  maxDelayTarget?: number
  /** The total number of retries, including immediate, pre-backoff, backoff, and post-backoff retries. */
  numRetries?: number
  /** The number of immediate retries (with no delay). */
  numNoDelayRetries?: number
  /** The number of immediate retries (with delay). */
  numMinDelayRetries?: number
  /** The number of post-backoff phase retries, with the maximum delay between retries. */
  numMaxDelayRetries?: number
  /** The algorithm for backoff between retries. */
  backoffFunction?: 'arithmetic' | 'exponential' | 'geometric' | 'linear'
  /** The maximum number of deliveries per second, per subscription. */
  maxReceivesPerSecond?: number
}

/**
 * Consumer Object for SNS.
 */
export type Consumer = {
  /** The protocol that this endpoint receives messages by. Can be http, https, email, email-json, sms, sqs, application, lambda or firehose. */
  protocol: 'http' | 'https' | 'email' | 'email-json' | 'sms' | 'sqs' | 'application' | 'lambda' | 'firehose'
  /** The endpoint messages are delivered to. */
  endpoint: Identifier
  /** Only receive a subset of messages from the channel, determined by this policy. */
  filterPolicy?: Record<string, any>
  /** Determines whether the FilterPolicy applies to MessageAttributes (default) or MessageBody. */
  filterPolicyScope?: string
  /** If true AWS SNS attributes are removed from the body, and for SQS, SNS message attributes are copied to SQS message attributes. If false the SNS attributes are included in the body. */
  rawMessageDelivery: boolean
  /** Prevent poison pill messages by moving un-processable messages to an SQS dead letter queue. */
  redrivePolicy?: RedrivePolicy
  /** Policy for retries to HTTP. The parameter is for that SNS Subscription and overrides any policy on the SNS Topic. */
  deliveryPolicy?: DeliveryPolicy
  /** The display name to use with an SMS subscription. */
  displayName?: string
}

/**
 * Protocol-specific information for an SNS operation.
 */
export type SnsOperationBinding = {
  /** Often we can assume that the SNS Topic is the channel name - we provide this field in case you need to supply the ARN, or the Topic name is not the channel name in the AsyncAPI document. */
  topic?: Identifier
  /** The protocols that listen to this topic and their endpoints. */
  consumers?: Consumer[]
  /** Policy for retries to HTTP. The field is the default for HTTP receivers of the SNS Topic which may be overridden by a specific consumer. */
  deliveryPolicy?: DeliveryPolicy
  /** The version of this binding. */
  bindingVersion?: string
}
