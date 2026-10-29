// Fonctions pures autour des recettes : lien source, identifiant, filtres, affichage.
import { tokens } from './matchIngredient.js'

// Lien source : seuls http et https sont acceptés (jamais javascript:, data:…).
// « marmiton.org/x » sans schéma est complété en https. Retourne l'URL propre ou null.
export function safeUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(s)
  const candidate = hasScheme || !/^[^\s/]+\.[a-z]{2,}(?:[/?#]|$)/i.test(s) ? s : 'https://' + s
  try {
    const u = new URL(candidate)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch { return null }
}

// Nom du site pour la colonne `source` (« www.marmiton.org » -> « marmiton.org »).
export function sourceFromUrl(url) {
  const safe = safeUrl(url)
  return safe ? new URL(safe).hostname.replace(/^www\./, '') : null
}

// Identifiant lisible et unique (colonne slug) : « Gratin de courgettes » -> « gratin-de-courgettes ».
export function slugify(titre, taken = new Set()) {
  const base = String(titre ?? '').toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'recette'
  let slug = base
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`
  return slug
}

// « chocolat, dessert , Rapide » -> ['chocolat', 'dessert', 'rapide'] (sans doublons).
export function parseTags(text) {
  return [...new Set(String(text ?? '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))]
}

// Index recipe_id -> lignes triées par position.
export function groupLines(lines) {
  const map = new Map()
  for (const l of lines) {
    if (!map.has(l.recipe_id)) map.set(l.recipe_id, [])
    map.get(l.recipe_id).push(l)
  }
  for (const list of map.values()) list.sort((a, b) => a.position - b.position)
  return map
}

// Filtre de la liste de recettes.
//  - query : tous les mots doivent se retrouver dans le titre ou dans un ingrédient
//    (nom du catalogue ou ligne d'origine) ;
//  - tags : la recette doit porter toutes les étiquettes choisies ;
//  - ingredientId : la recette doit contenir cet ingrédient du catalogue.
export function filterRecipes(recipes, { query = '', tags = [], ingredientId = null }, linesByRecipe, ingredientsById) {
  const q = tokens(query)
  return recipes.filter((r) => {
    const lines = linesByRecipe.get(r.id) ?? []
    if (tags.length && !tags.every((t) => (r.tags ?? []).includes(t))) return false
    if (ingredientId && !lines.some((l) => l.ingredient_id === ingredientId)) return false
    if (!q.length) return true
    const hay = [
      ...tokens(r.titre),
      ...(r.ingredients ?? []).flatMap(tokens),
      ...lines.flatMap((l) => tokens(ingredientsById.get(l.ingredient_id)?.nom)),
    ]
    return q.every((t) => hay.some((h) => h.startsWith(t)))
  })
}

// Toutes les étiquettes utilisées, triées.
export function allTags(recipes) {
  return [...new Set(recipes.flatMap((r) => r.tags ?? []))].sort((a, b) => a.localeCompare(b, 'fr'))
}

export function formatTime(min) {
  if (min == null) return null
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

// 200 g, 1,5 càs, « à votre goût » si la quantité est vide.
export function formatQuantity(quantite, unite) {
  if (quantite == null) return 'à votre goût'
  const n = String(Math.round(Number(quantite) * 100) / 100).replace('.', ',')
  return unite ? `${n} ${unite === 'pièce' ? '' : unite}`.trim() : n
}
