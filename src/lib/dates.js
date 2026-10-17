// Calcul de dates, fonctions pures. Tout est en dates LOCALES au format
// 'AAAA-MM-JJ' ; les calculs passent par Date.UTC pour qu'aucun fuseau ni
// changement d'heure ne puisse décaler d'un jour.
export { todayIso, formatDateFr } from './expiry'

const DAY_MS = 86400000

function parts(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return { y, m, d }
}

function fromUtc(ms) {
  const dt = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

// Ajoute n jours (n peut être négatif).
export function addDays(isoDate, n) {
  const { y, m, d } = parts(isoDate)
  return fromUtc(Date.UTC(y, m - 1, d + n))
}

// Ajoute n mois calendaires ; si le jour n'existe pas dans le mois d'arrivée,
// on se cale sur son dernier jour (31 janv. + 1 mois = 28 ou 29 févr.).
export function addMonths(isoDate, n) {
  const { y, m, d } = parts(isoDate)
  const first = Date.UTC(y, m - 1 + n, 1) // 1er du mois d'arrivée
  const target = new Date(first)
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  return fromUtc(first + (Math.min(d, lastDay) - 1) * DAY_MS)
}

// Nombre de jours entre deux dates (négatif si `to` est avant `from`).
export function daysBetween(from, to) {
  const a = parts(from)
  const b = parts(to)
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / DAY_MS)
}
