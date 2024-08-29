type SafeJSONReturn<T> =
  | {
      error: false
      data: T
    }
  | {
      error: true
      message: string
    }

export const safeJSON = {
  parse<T>(v: any): SafeJSONReturn<T> {
    try {
      return {
        error: false,
        data: JSON.parse(v),
      }
    } catch (e: any) {
      return {
        error: true,
        message: e.message ? String(e.message) : 'Unknown Error',
      }
    }
  },
}
