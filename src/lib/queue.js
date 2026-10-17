// File d'attente du mode rangement : fonctions pures + sauvegarde localStorage.
// Une ligne : { key, barcode, name, brand, image_url, category, quantity, location,
//   cachedDays, expires_at, lookup, needsName }
//  - expires_at = null : la ligne suit la date suggérée (pas encore touchée)
//  - lookup = 'pending' pendant la recherche du produit, puis 'done'
import { buildItem, suggestFor } from './quickAdd'
import { todayIso } from './dates'

export const QUEUE_STORAGE_KEY = 'frigo.rangementQueue'

// Ajoute un scan : même code-barres = quantité +1, sinon nouvelle ligne en recherche.
export function addScan(rows, code, key) {
  const existing = rows.find((r) => r.barcode === code)
  if (existing) {
    return { rows: rows.map((r) => (r === existing ? { ...r, quantity: r.quantity + 1 } : r)), isNew: false }
  }
  const row = {
    key, barcode: code, name: '', brand: '', image_url: '', category: 'autre',
    quantity: 1, location: 'frigo', cachedDays: null, expires_at: null,
    lookup: 'pending', needsName: false,
  }
  return { rows: [...rows, row], isNew: true }
}

// Résultat de lookupProduct appliqué à la ligne en recherche. Ne remplace jamais
// un nom déjà tapé à la main.
export function applyLookup(rows, code, result) {
  return rows.map((r) => {
    if (r.barcode !== code || r.lookup !== 'pending') return r
    const p = result?.status === 'found' ? result.product : null
    const name = r.name || p?.name || ''
    return {
      ...r,
      name,
      brand: r.brand || p?.brand || '',
      category: p?.category || r.category,
      image_url: r.image_url || p?.image_url || '',
      cachedDays: Number.isInteger(result?.shelfDays) ? result.shelfDays : null,
      lookup: 'done',
      needsName: !name.trim(),
    }
  })
}

export const patchRow = (rows, key, patch) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r))
export const removeRow = (rows, key) => rows.filter((r) => r.key !== key)

// « Tout ajouter » : au moins une ligne, toutes nommées, aucune recherche en cours.
export function canAddAll(rows) {
  return rows.length > 0 && rows.every((r) => r.lookup !== 'pending' && r.name.trim())
}

// Date effective d'une ligne : celle choisie, sinon la suggestion.
export function rowSuggestion(row, today = todayIso()) {
  return suggestFor({ cachedDays: row.cachedDays, location: row.location, category: row.category }, today)
}
export function rowDate(row, today = todayIso()) {
  return row.expires_at ?? rowSuggestion(row, today).date
}

// Lignes -> tableau à insérer en une seule requête.
export function rowsToItems(rows, today = todayIso()) {
  return rows.map((r) => buildItem(r, rowDate(r, today)))
}

// ---- Sauvegarde (le stockage peut être indisponible : on ne plante jamais) ----
export function saveQueue(rows, storage = globalThis.localStorage) {
  try { storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(rows)) } catch { /* ignoré */ }
}

export function loadQueue(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(QUEUE_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r) => r && typeof r.key === 'string' && typeof r.barcode === 'string')
      .map((r) => {
        const name = String(r.name ?? '')
        return {
          key: r.key, barcode: r.barcode, name,
          brand: String(r.brand ?? ''), image_url: String(r.image_url ?? ''),
          category: String(r.category ?? 'autre'),
          quantity: Math.max(1, Math.round(Number(r.quantity) || 1)),
          location: String(r.location ?? 'frigo'),
          cachedDays: Number.isInteger(r.cachedDays) ? r.cachedDays : null,
          expires_at: typeof r.expires_at === 'string' ? r.expires_at : null,
          lookup: 'done', // une recherche interrompue ne reprendra pas : nom à compléter
          needsName: r.needsName === true || !name.trim(),
        }
      })
  } catch {
    return []
  }
}
