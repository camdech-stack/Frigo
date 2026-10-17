// Logique de la vue Aperçu : regroupement par urgence, compteurs, repli du groupe « Ça va ».
// Fonctions pures (aucune dépendance à React ni à Supabase), faciles à tester.
import { daysLeft, urgency } from './expiry'

// Un produit sans date n'a rien d'urgent : il va dans « Ça va ».
function daysOf(item, today) {
  return item.expires_at ? daysLeft(item.expires_at, today) : Infinity
}

// Regroupe les produits (déjà triés par date) :
//  urgent = expiré ou <= 2 j, soon = 3 à 5 j, ok = le reste. Mêmes seuils que la liste (expiry.urgency).
export function groupByUrgency(items, today) {
  const groups = { urgent: [], soon: [], ok: [] }
  for (const item of items) {
    const level = urgency(daysOf(item, today))
    groups[level === 'red' ? 'urgent' : level === 'orange' ? 'soon' : 'ok'].push(item)
  }
  return groups
}

// Les trois compteurs du haut de la vue.
export function overviewCounts(items, today) {
  const g = groupByUrgency(items, today)
  return { urgent: g.urgent.length, soon: g.soon.length, total: items.length }
}

// Repli du groupe « Ça va » : replié = aucune ligne, seulement « + N autres produits ».
export function collapseOk(okItems, expanded) {
  return expanded
    ? { visible: okItems, hiddenCount: 0 }
    : { visible: [], hiddenCount: okItems.length }
}

export function moreLabel(n) {
  return `+ ${n} autre${n > 1 ? 's' : ''} produit${n > 1 ? 's' : ''}`
}

// État global de la vue : 'empty' (rien en stock), 'calm' (rien d'urgent), 'busy' (au moins un urgent).
export function overviewState(items, today) {
  if (items.length === 0) return 'empty'
  return groupByUrgency(items, today).urgent.length === 0 ? 'calm' : 'busy'
}
