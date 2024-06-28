/**
 * Get a human-readable string representing the time elapsed since the given Unix timestamp.
 */
export function humanDiff(unixTimestamp: number) {
  const seconds = Math.floor((new Date().getTime() - unixTimestamp) / 1000)

  if (seconds < 45) {
    return 'just now'
  }

  // less than a minute, return the seconds
  if (seconds < 60) {
    return `${seconds} seconds ago`
  }

  // less than an hour, return the minutes
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  // less than a day, return the hours
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  // less than a month, return the days
  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  // less than a year, return the months
  const months = Math.floor(days / 30)
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`
  }

  return 'more than a year ago'
}
