/**
 * Null-body statuses per the Fetch spec
 * (https://fetch.spec.whatwg.org/#null-body-status).
 *
 * Shared between the main process (so it skips buffering a body for these
 * statuses before sending over IPC) and the renderer (so the DOM `Response`
 * constructor does not throw — it rejects any non-null body for these codes).
 *
 * Keep this single source of truth so the main and renderer never disagree
 * about which statuses can carry a body.
 */
export const NULL_BODY_STATUSES: ReadonlySet<number> = new Set([101, 204, 205, 304])
