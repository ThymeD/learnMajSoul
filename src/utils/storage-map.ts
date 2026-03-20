export function normalizeRecordKeys(
  input: Record<string, number>,
  normalizeKey: (key: string) => string
): Record<string, number> {
  const normalized: Record<string, number> = {}
  Object.entries(input).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = value
  })
  return normalized
}

export function loadNormalizedNumberMap(
  storageKey: string,
  normalizeKey: (key: string) => string
): Record<string, number> {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return {}

  const parsed = JSON.parse(raw) as Record<string, number>
  const normalized = normalizeRecordKeys(parsed, normalizeKey)
  localStorage.setItem(storageKey, JSON.stringify(normalized))
  return normalized
}

export function saveNormalizedNumberMap(
  storageKey: string,
  input: Record<string, number>,
  normalizeKey: (key: string) => string
): void {
  const normalized = normalizeRecordKeys(input, normalizeKey)
  localStorage.setItem(storageKey, JSON.stringify(normalized))
}

export function normalizeObjectKeys<T>(
  input: Record<string, T>,
  normalizeKey: (key: string) => string
): Record<string, T> {
  const normalized: Record<string, T> = {}
  Object.entries(input).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = value
  })
  return normalized
}

export function loadNormalizedObjectMap<T>(
  storageKey: string,
  normalizeKey: (key: string) => string
): Record<string, T> {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return {}

  const parsed = JSON.parse(raw) as Record<string, T>
  const normalized = normalizeObjectKeys(parsed, normalizeKey)
  localStorage.setItem(storageKey, JSON.stringify(normalized))
  return normalized
}

export function saveNormalizedObjectMap<T>(
  storageKey: string,
  input: Record<string, T>,
  normalizeKey: (key: string) => string
): void {
  const normalized = normalizeObjectKeys(input, normalizeKey)
  localStorage.setItem(storageKey, JSON.stringify(normalized))
}
