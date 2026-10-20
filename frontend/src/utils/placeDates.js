export function relativeTime(str) {
  if (!str) return str
  return str
}

export function isOpenNow(horaires, now = new Date()) {
  if (!horaires || typeof horaires !== 'string') return null

  const cleaned = horaires.replace(/–/g, '-')
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
  if (!match) return null

  const startHour = parseInt(match[1], 10)
  const startMin = parseInt(match[2], 10)
  const endHour = parseInt(match[3], 10)
  const endMin = parseInt(match[4], 10)

  const currentHour = now.getHours()
  const currentMin = now.getMinutes()

  const currentMinutes = currentHour * 60 + currentMin
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  if (endMinutes >= startMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}

export function dateExactePourTitle(dateStr) {
  if (!dateStr) return ''

  if (dateStr.toLowerCase().includes('il y a')) {
    return dateStr
  }

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateStr
  }
}
