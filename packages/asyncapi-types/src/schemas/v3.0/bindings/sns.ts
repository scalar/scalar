import { Type } from '@scalar/typebox'

import {
  SnsConsumerRef,
  SnsDeliveryPolicyRef,
  SnsIdentifierRef,
  SnsOrderingRef,
  SnsPolicyRef,
  SnsRedrivePolicyRef,
  SnsStatementRef,
} from '../ref-definitions'

/**
 * Ordering Object for SNS.
 */
export const OrderingSchemaDefinition = Type.Object({
  /** Defines the type of SNS Topic. Can be either standard or FIFO. */
  type: Type.Union([Type.Literal('standard'), Type.Literal('FIFO')]),
  /** Whether the de-duplication of messages should be turned on. Defaults to false. */
  contentBasedDeduplication: Type.Optional(Type.Boolean()),
})

/**
 * Statement Object for SNS Policy.
 */
export const StatementSchemaDefinition = Type.Object({
  /** Either Allow or Deny. */
  effect: Type.Union([Type.Literal('Allow'), Type.Literal('Deny')]),
  /** The AWS account(s) or resource ARN(s) that the statement applies to. */
  principal: Type.Union([
    Type.String(),
    Type.Record(Type.String(), Type.Union([Type.String(), Type.Array(Type.String())])),
  ]),
  /** The SNS permission being allowed or denied e.g. sns:Publish. */
  action: Type.Union([Type.String(), Type.Array(Type.String())]),
  /** The resource(s) that this policy applies to. */
  resource: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
  /** Specific circumstances under which the policy grants permission. */
  condition: Type.Optional(
    Type.Union([Type.Record(Type.String(), Type.Any()), Type.Array(Type.Record(Type.String(), Type.Any()))]),
  ),
})

/**
 * Policy Object for SNS.
 */
export const PolicySchemaDefinition = Type.Object({
  /** An array of Statement objects, each of which controls a permission for this topic. */
  statements: Type.Array(SnsStatementRef),
})

/**
 * Protocol-specific information for an SNS channel.
 */
export const SnsChannelBindingSchemaDefinition = Type.Object({
  /** The name of the topic. Can be different from the channel name to allow flexibility around AWS resource naming limitations. */
  name: Type.String(),
  /** By default, we assume an unordered SNS topic. This field allows configuration of a FIFO SNS Topic. */
  ordering: Type.Optional(SnsOrderingRef),
  /** The security policy for the SNS Topic. */
  policy: Type.Optional(SnsPolicyRef),
  /** Key-value pairs that represent AWS tags on the topic. */
  tags: Type.Optional(Type.Record(Type.String(), Type.String())),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Identifier Object for SNS.
 */
export const IdentifierSchemaDefinition = Type.Object({
  /** The endpoint is a URL. */
  url: Type.Optional(Type.String()),
  /** The endpoint is an email address. */
  email: Type.Optional(Type.String()),
  /** The endpoint is a phone number. */
  phone: Type.Optional(Type.String()),
  /** The target is an ARN. For example, for SQS, the identifier may be an ARN. */
  arn: Type.Optional(Type.String()),
  /** The endpoint is identified by a name, which corresponds to an identifying field called name of a binding for that protocol on the Operation Object. */
  name: Type.Optional(Type.String()),
})

/**
 * Redrive Policy Object for SNS.
 */
export const RedrivePolicySchemaDefinition = Type.Object({
  /** The SQS queue to use as a dead letter queue (DLQ). */
  deadLetterQueue: SnsIdentifierRef,
  /** The number of times a message is delivered to the source queue before being moved to the dead-letter queue. Defaults to 10. */
  maxReceiveCount: Type.Optional(Type.Integer()),
})

/**
 * Delivery Policy Object for SNS.
 */
export const DeliveryPolicySchemaDefinition = Type.Object({
  /** The minimum delay for a retry in seconds. */
  minDelayTarget: Type.Optional(Type.Integer()),
  /** The maximum delay for a retry in seconds. */
  maxDelayTarget: Type.Optional(Type.Integer()),
  /** The total number of retries, including immediate, pre-backoff, backoff, and post-backoff retries. */
  numRetries: Type.Optional(Type.Integer()),
  /** The number of immediate retries (with no delay). */
  numNoDelayRetries: Type.Optional(Type.Integer()),
  /** The number of immediate retries (with delay). */
  numMinDelayRetries: Type.Optional(Type.Integer()),
  /** The number of post-backoff phase retries, with the maximum delay between retries. */
  numMaxDelayRetries: Type.Optional(Type.Integer()),
  /** The algorithm for backoff between retries. */
  backoffFunction: Type.Optional(
    Type.Union([
      Type.Literal('arithmetic'),
      Type.Literal('exponential'),
      Type.Literal('geometric'),
      Type.Literal('linear'),
    ]),
  ),
  /** The maximum number of deliveries per second, per subscription. */
  maxReceivesPerSecond: Type.Optional(Type.Integer()),
})

/**
 * Consumer Object for SNS.
 */
export const ConsumerSchemaDefinition = Type.Object({
  /** The protocol that this endpoint receives messages by. Can be http, https, email, email-json, sms, sqs, application, lambda or firehose. */
  protocol: Type.Union([
    Type.Literal('http'),
    Type.Literal('https'),
    Type.Literal('email'),
    Type.Literal('email-json'),
    Type.Literal('sms'),
    Type.Literal('sqs'),
    Type.Literal('application'),
    Type.Literal('lambda'),
    Type.Literal('firehose'),
  ]),
  /** The endpoint messages are delivered to. */
  endpoint: SnsIdentifierRef,
  /** Only receive a subset of messages from the channel, determined by this policy. */
  filterPolicy: Type.Optional(Type.Record(Type.String(), Type.Any())),
  /** Determines whether the FilterPolicy applies to MessageAttributes (default) or MessageBody. */
  filterPolicyScope: Type.Optional(Type.String()),
  /** If true AWS SNS attributes are removed from the body, and for SQS, SNS message attributes are copied to SQS message attributes. If false the SNS attributes are included in the body. */
  rawMessageDelivery: Type.Boolean(),
  /** Prevent poison pill messages by moving un-processable messages to an SQS dead letter queue. */
  redrivePolicy: Type.Optional(SnsRedrivePolicyRef),
  /** Policy for retries to HTTP. The parameter is for that SNS Subscription and overrides any policy on the SNS Topic. */
  deliveryPolicy: Type.Optional(SnsDeliveryPolicyRef),
  /** The display name to use with an SMS subscription. */
  displayName: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an SNS operation.
 */
export const SnsOperationBindingSchemaDefinition = Type.Object({
  /** Often we can assume that the SNS Topic is the channel name - we provide this field in case you need to supply the ARN, or the Topic name is not the channel name in the AsyncAPI document. */
  topic: Type.Optional(SnsIdentifierRef),
  /** The protocols that listen to this topic and their endpoints. */
  consumers: Type.Optional(Type.Array(SnsConsumerRef)),
  /** Policy for retries to HTTP. The field is the default for HTTP receivers of the SNS Topic which may be overridden by a specific consumer. */
  deliveryPolicy: Type.Optional(SnsDeliveryPolicyRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})
