export type ImportDocumentFromRegistry = (meta: { namespace: string; slug: string; version?: string }) => Promise<
  | {
      ok: true
      data: Record<string, unknown>
    }
  | {
      ok: false
      error: string
    }
>
