/**
 * An example of a Message Object, including both headers and payload.
 *
 * This object is used to provide examples of messages within AsyncAPI documents.
 */
export type MessageExampleObject = {
  /** A map where keys are the name of the header and values are example values. */
  headers?: Record<string, any>
  /** The value of the payload. It can be of any type. */
  payload?: any
  /** A machine-friendly name for the message example. */
  name?: string
  /** A short summary of what the example is about. */
  summary?: string
}
