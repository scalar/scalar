/**
 * Formats milliseconds to seconds and appends an "s" if more than one second
 * else returns ms appended to the number
 */
export const formatMilliseconds = (ms: number, decimals = 2): string => {
  if (ms > 1000) {
    return (ms / 1000).toFixed(decimals) + 's'
  }
  return ms + 'ms'
}
