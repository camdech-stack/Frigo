// Rapprochement d'un nom d'ingrédient avec le catalogue, par comparaison normalisée.
// Fonctions pures, sans IA : sans accents, sans majuscules, singulier/pluriel, mots en commun.

const STOP = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'au', 'aux', 'a', 'en', 'et'])

// « Crème fraîche épaisse » -> ['creme', 'fraiche', 'epaisse'] (puis singulier).
export function tokens(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOP.has(t))
    // Singulier simple : on retire un « s » ou « x » final. Appliqué des deux côtés, donc cohérent.
    .map((t) => (t.length > 3 && /[sx]$/.test(t) ? t.slice(0, -1) : t))
}

export const normalizeName = (name) => tokens(name).join(' ')

// Meilleur ingrédient du catalogue pour `name`, ou null. Score de 0 à 1 :
// 1 = mêmes mots ; sinon part des mots en commun (au moins la moitié des mots du plus long).
export function matchIngredient(name, catalog, threshold = 0.5) {
  const a = tokens(name)
  if (!a.length) return null
  const key = a.join(' ')
  let best = null
  for (const ing of catalog) {
    const b = tokens(ing.nom)
    if (!b.length) continue
    let score
    if (b.join(' ') === key) score = 1
    else {
      const common = a.filter((t) => b.includes(t)).length
      score = common / Math.max(a.length, b.length)
    }
    // À score égal, le nom le plus court (le plus générique) gagne.
    if (score >= threshold && (!best || score > best.score || (score === best.score && ing.nom.length < best.ingredient.nom.length))) {
      best = { ingredient: ing, score }
    }
  }
  return best
}

// Recherche dans une liste (catalogue, étiquettes…) : tous les mots saisis doivent apparaître,
// sans accents, singulier/pluriel indifférents. Requête vide = tout.
export function searchByName(query, list, getName = (x) => x.nom) {
  const q = tokens(query)
  if (!q.length) return list
  return list.filter((x) => {
    const hay = tokens(getName(x))
    return q.every((t) => hay.some((h) => h.startsWith(t)))
  })
}
