// Saisie rapide : boutons de durée, date suggérée, construction de l'item à insérer.
// Fonctions pures (la date du jour est injectable pour les tests).
import { addDays, addMonths, daysBetween, formatDateFr, todayIso } from './dates'
import { chooseShelfDays } from './shelfLife'

export const DURATIONS = [
  { id: '3d', label: '+3 j', add: (d) => addDays(d, 3) },
  { id: '1w', label: '+1 sem', add: (d) => addDays(d, 7) },
  { id: '2w', label: '+2 sem', add: (d) => addDays(d, 14) },
  { id: '1m', label: '+1 mois', add: (d) => addMonths(d, 1) },
]

// [{ id, label, date, dateLabel }] : la date que donnerait chaque bouton.
export function durationOptions(today = todayIso()) {
  return DURATIONS.map(({ id, label, add }) => {
    const date = add(today)
    return { id, label, date, dateLabel: formatDateFr(date) }
  })
}

// Date suggérée : { date, dateLabel, days, source } (voir chooseShelfDays).
export function suggestFor({ cachedDays, location, category }, today = todayIso()) {
  const { days, source } = chooseShelfDays({ cachedDays, location, category })
  const date = addDays(today, days)
  return { date, dateLabel: formatDateFr(date), days, source }
}

// Durée à mémoriser pour le prochain scan : jours entre aujourd'hui et la date
// choisie, seulement si positive (sinon null = on ne touche à rien).
export function shelfDaysToRemember(expiresAt, today = todayIso()) {
  if (!expiresAt) return null
  const days = daysBetween(today, expiresAt)
  return days > 0 ? days : null
}

// Ligne `items` prête à insérer.
export function buildItem({ name, brand, barcode, image_url, category, quantity, location }, expiresAt) {
  return {
    name: String(name).trim(),
    brand: String(brand ?? '').trim() || null,
    barcode: barcode || null,
    image_url: image_url || null,
    category: category || 'autre',
    quantity,
    unit: 'pièce',
    location: location || 'frigo',
    expires_at: expiresAt,
  }
}

// Quantité −/+ : jamais en dessous de 1 (entiers pour la saisie rapide).
export function stepQuantity(quantity, delta) {
  return Math.max(1, Math.round(Number(quantity) || 1) + delta)
}
