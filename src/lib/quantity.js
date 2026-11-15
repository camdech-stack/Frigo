// Quantités en unités réelles (g, ml, pièce) : conversions et consommation partielle.
// Fonctions pures, sans dépendance.

const round = (n) => Math.round(n * 1000) / 1000 // évite 0.1 + 0.2 = 0.30000000000000004

// Unité saisie ou lue -> [facteur, unité de stock]. Insensible à la casse (mL, ML, ml…).
const FACTORS = {
  g: [1, 'g'], kg: [1000, 'g'],
  ml: [1, 'ml'], cl: [10, 'ml'], dl: [100, 'ml'], l: [1000, 'ml'],
  pièce: [1, 'pièce'], piece: [1, 'pièce'], paquet: [1, 'pièce'],
}

// 1,5 L -> { quantity: 1500, unit: 'ml' }. Unité inconnue : null.
export function toStockUnit(value, unit) {
  const f = FACTORS[String(unit ?? '').trim().toLowerCase()]
  const n = Number(value)
  if (!f || !Number.isFinite(n)) return null
  return { quantity: round(n * f[0]), unit: f[1] }
}

// Champ « quantity » d'Open Food Facts : « 500 g », « 1,5 L », « 33 cl », « 4 x 125 g », « 75cl ».
// Retourne { quantity, unit } en g ou ml, ou null (« 6 yaourts », vide, illisible).
export function parseOffQuantity(text) {
  const m = String(text ?? '').match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|dl|cl|ml|l)\b/i)
  if (!m) return null
  const count = m[1] ? Number(m[1]) : 1
  const one = toStockUnit(Number(m[2].replace(',', '.')), m[3])
  if (!one || !(one.quantity > 0) || !(count > 0)) return null
  return { quantity: round(one.quantity * count), unit: one.unit }
}

// Quantité consommée : bornée au stock restant. Retourne { consumed, remaining } ou null si invalide.
export function consume(quantity, amount) {
  const q = Number(quantity)
  const a = Number(amount)
  if (!(a > 0) || !(q > 0)) return null
  const consumed = Math.min(a, q)
  return { consumed: round(consumed), remaining: round(q - consumed) }
}

// Raccourci « − moitié » : la moitié du reste (arrondie au centième pour rester lisible).
export const halfOf = (quantity) => Math.round((Number(quantity) / 2) * 100) / 100
