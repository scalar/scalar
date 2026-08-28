---
'@scalar/mock-server': minor
---

Answer unhandled errors with a structured JSON `500` naming the operation that failed, instead of the previous plain-text `Internal Server Error`. The body reports the error `message` along with the matched operation's `method`, OpenAPI `path`, and `operationId` (when the document declares one), and the error is still logged to the console. Errors that already carry their own response keep the status and body they chose.
