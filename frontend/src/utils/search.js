export function normalize(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function levenshteinDistance(a, b) {
  const matrix = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export function matchScore(text, query) {
  if (!text || !query) return 0

  const normalizedText = normalize(text)
  const normalizedQuery = normalize(query)

  if (normalizedText === normalizedQuery) return 100
  if (normalizedText.includes(normalizedQuery)) return 80

  const queryTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 0)
  const textTokens = normalizedText.split(/\s+/).filter((t) => t.length > 0)

  if (queryTokens.length === 0) return 0

  let matches = 0
  let totalScore = 0

  for (const qToken of queryTokens) {
    let bestForToken = 0
    for (const tToken of textTokens) {
      if (tToken.includes(qToken)) {
        bestForToken = Math.max(bestForToken, 70)
        continue
      }
      if (qToken.length > 2 && tToken.length > 2) {
        const dist = levenshteinDistance(qToken, tToken)
        if (dist <= 1) {
          bestForToken = Math.max(bestForToken, 40)
        }
      }
    }
    if (bestForToken > 0) {
      matches++
      totalScore += bestForToken
    }
  }

  if (matches === 0) return 0
  return Math.round(totalScore / queryTokens.length)
}

export function groupSuggestions(suggestions) {
  const groups = {
    'Lieux': [],
    'Fokontany': [],
    'Quartiers': [],
    'Marchés': [],
    'Écoles': []
  }

  for (const s of suggestions) {
    const type = s.type || ''
    if (type === 'lieu') {
      groups['Lieux'].push(s)
    } else if (type === 'fokontany') {
      groups['Fokontany'].push(s)
    } else if (type === 'quartier') {
      groups['Quartiers'].push(s)
    } else if (type === 'marche') {
      groups['Marchés'].push(s)
    } else if (type === 'ecole') {
      groups['Écoles'].push(s)
    } else {
      groups['Lieux'].push(s)
    }
  }

  const result = {}
  for (const [key, value] of Object.entries(groups)) {
    if (value.length > 0) {
      result[key] = value
    }
  }
  return result
}
