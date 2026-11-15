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

// ---- Rattachement d'un produit du commerce (nom d'emballage) à un ingrédient du catalogue ----

// Mots sans valeur pour le rapprochement : mentions bio/qualité, « n°5 », « MG »… Les nombres
// et pourcentages (30%, 500g) sont retirés à part.
const NOISE = new Set(['bio', 'biologique', 'mg', 'n', 'x', 'extra', 'fin', 'lot', 'format', 'familial', 'marque', 'nature'])

// Mots utiles d'un nom de produit : sans pourcentages, quantités, mentions bio ni marque.
function productTokens(name, brand) {
  const brandTokens = new Set(tokens(brand))
  return tokens(String(name ?? '').replace(/\d+([.,]\d+)?\s*(%|kg|g|cl|ml|l)\b/gi, ' '))
    .filter((t) => !/^\d+$/.test(t) && !NOISE.has(t) && !brandTokens.has(t))
}

// Suggestion d'ingrédient pour un produit : le catalogue doit être « couvert » par le nom, c'est-à-dire
// que TOUS les mots de l'ingrédient apparaissent dans le nom du produit (« Crème fraîche épaisse 30% MG
// Président » couvre « crème fraîche » mais pas « crème liquide »). Le plus précis gagne (le plus de mots),
// puis celui qui occupe la plus grande part du nom. Retourne { ingredient, score } ou null.
export function suggestIngredient(name, catalog, { brand = '' } = {}) {
  const words = productTokens(name, brand)
  if (!words.length) return null
  let best = null
  for (const ing of catalog) {
    const b = tokens(ing.nom)
    if (!b.length || !b.every((t) => words.includes(t))) continue
    const score = b.length + b.length / words.length // précision d'abord, part du nom ensuite
    if (!best || score > best.score) best = { ingredient: ing, score }
  }
  return best
}
