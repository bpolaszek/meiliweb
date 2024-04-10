type FormatDateOptions = Intl.DateTimeFormatOptions & {
  locale?: Intl.LocalesArgument
  displayTimeZone?: boolean
}

export const PRETTY_DATE = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}
export const PRETTY_DATE_SHORT = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}

interface Duration {
  days: number
  hours: number
  minutes: number
  seconds: number
  ms: number
}

function parseISOString(durationString: string): Duration {
  const regex = /P(?:([\d.]+)D)?T(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?/
  const matches = durationString.match(regex)

  if (!matches) {
    throw new Error('Invalid duration string format.')
  }

  const [, daysStr, hoursStr, minutesStr, secondsStr] = matches
  const days = daysStr ? parseFloat(daysStr) : 0
  const hours = hoursStr ? parseFloat(hoursStr) : 0
  const minutes = minutesStr ? parseFloat(minutesStr) : 0
  const seconds = secondsStr ? parseFloat(secondsStr) : 0

  const totalSeconds =
    days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)

  return {
    days: Math.floor(days),
    hours: totalHours % 24,
    minutes: totalMinutes % 60,
    seconds: Math.floor(totalSeconds % 60),
    ms: Math.floor((totalSeconds % 1) * 1000),
  }
}

export const useDateFormatter = () => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const formatDate = (
    date: Date | string | null,
    options: FormatDateOptions = {},
  ) => {
    if (null == date) {
      return null
    }
    const timeZone = options.timeZone ?? userTimeZone
    options.timeZone = timeZone
    let output = new Date(date).toLocaleString(options?.locale, options)
    if (options.displayTimeZone) {
      output = output + ` (${timeZone})`
    }

    return output
  }

  const formatDuration = (duration: string): string => {
    const { days, hours, minutes, seconds, ms } = parseISOString(duration)

    const parts = []
    if (days) {
      parts.push(`${days}d`)
    }
    if (hours || parts.length > 0) {
      parts.push(`${hours}h`)
    }
    if (minutes || parts.length > 0) {
      parts.push(`${minutes}m`)
    }
    if (seconds || ms) {
      if (ms && seconds < 10) parts.push(`${seconds}.${ms}s`)
      else parts.push(`${seconds}s`)
    }

    return parts.join(' ')
  }

  return { formatDate, formatDuration }
}
