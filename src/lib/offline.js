// Libellé du bandeau hors ligne. `lastSync` = timestamp (ms) de la dernière donnée reçue, ou null.
export function offlineLabel(lastSync) {
  if (!lastSync) return 'Hors ligne'
  const time = new Date(lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `Hors ligne, données de ${time}`
}

// Dernière liste connue, gardée dans localStorage pour que l'app installée s'ouvre
// avec ses données même sans réseau. Jamais bloquant : tout est dans des try/catch.
const KEY = 'frigo.itemsSnapshot'

export function loadSnapshot() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    return s && Array.isArray(s.items) ? s : null
  } catch { return null }
}

export function saveSnapshot(items, at) {
  try { localStorage.setItem(KEY, JSON.stringify({ items, at })) } catch { /* stockage plein ou indisponible */ }
}

export function clearSnapshot() {
  try { localStorage.removeItem(KEY) } catch { /* ignoré */ }
}
