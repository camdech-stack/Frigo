import { useMemo } from 'react'
import { useLiveTable } from './useLiveTable'
import { groupLines, slugify, sourceFromUrl } from './recipes'
import { normalizeName } from './matchIngredient'
import {
  currentUserEmail, deleteLines, deleteRecipe, insertIngredients, insertLines, insertRecipe,
  updateIngredient, updateRecipe,
} from './recipesApi'

// Base de recettes : catalogue d'ingrédients, recettes et lignes d'ingrédients, en temps réel,
// plus les écritures. Appelé une fois par le provider (au-dessus du routeur).
export function useRecipeData() {
  const ing = useLiveTable('ingredients', 'nom')
  const rec = useLiveTable('recipes', 'titre')
  const lin = useLiveTable('recipe_ingredients', 'recipe_id')

  const ingredients = useMemo(() => [...ing.rows].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [ing.rows])
  const recipes = useMemo(() => [...rec.rows].sort((a, b) => a.titre.localeCompare(b.titre, 'fr')), [rec.rows])
  const ingredientsById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients])
  const linesByRecipe = useMemo(() => groupLines(lin.rows), [lin.rows])

  const loading = ing.loading || rec.loading || lin.loading
  const loadError = ing.loadError || rec.loadError || lin.loadError
  const reload = () => { ing.reload(); rec.reload(); lin.reload() }

  // Modification du catalogue (rayon, unité, basique, format d'achat, prix). Retourne une erreur ou null.
  async function saveIngredient(id, patch) {
    const result = await updateIngredient(id, patch)
    if (result.error) return 'Modification impossible : ' + result.error
    ing.apply({ eventType: 'UPDATE', new: result.data })
    return null
  }

  // Enregistre une recette (création si `id` absent) avec ses ingrédients structurés.
  //  fields : { titre, url, portions, temps_min, tags, ingredients (lignes d'origine) }
  //  rows   : [{ ingredientId, create: { nom, rayon, unite, basique } | null, quantite, unite }]
  // Les ingrédients à créer sont ajoutés au catalogue d'abord. Retourne une erreur (texte) ou null.
  async function saveRecipe({ id = null, fields, rows }) {
    // 1. Ingrédients à créer : un seul par nom normalisé, et jamais un doublon du catalogue.
    const known = new Map(ingredients.map((i) => [normalizeName(i.nom), i.id]))
    const toCreate = new Map()
    for (const r of rows) {
      if (r.ingredientId || !r.create) continue
      const key = normalizeName(r.create.nom)
      if (!known.has(key) && !toCreate.has(key)) {
        toCreate.set(key, {
          nom: r.create.nom.trim(), rayon: r.create.rayon.trim() || 'autre',
          unite: r.create.unite, basique: Boolean(r.create.basique),
        })
      }
    }
    if (toCreate.size) {
      const created = await insertIngredients([...toCreate.values()])
      if (created.error) return 'Création des ingrédients impossible : ' + created.error
      for (const row of created.data) {
        ing.apply({ eventType: 'INSERT', new: row })
        known.set(normalizeName(row.nom), row.id)
      }
    }
    const lines = rows.map((r, position) => ({
      position,
      ingredient_id: r.ingredientId ?? known.get(normalizeName(r.create.nom)),
      quantite: r.quantite,
      unite: r.quantite === null ? null : r.unite || null,
    }))

    const base = { ...fields, source: sourceFromUrl(fields.url) }
    if (!id) return createRecipe(base, lines)
    return editRecipe(id, base, lines)
  }

  async function createRecipe(base, lines) {
    const taken = new Set(rec.rows.map((r) => r.slug))
    const ajoute_par = await currentUserEmail()
    let result = await insertRecipe({ ...base, ajoute_par, slug: slugify(base.titre, taken) })
    // Slug déjà pris (créé entre-temps depuis un autre appareil) : on réessaie avec un suffixe.
    if (result.code === '23505') {
      result = await insertRecipe({ ...base, ajoute_par, slug: slugify(base.titre, taken) + '-' + Math.random().toString(36).slice(2, 6) })
    }
    if (result.error) return 'Enregistrement impossible : ' + result.error
    const recipe = result.data
    const inserted = await insertLines(lines.map((l) => ({ ...l, recipe_id: recipe.id })))
    if (inserted.error) {
      await deleteRecipe(recipe.id) // pas de recette à moitié enregistrée
      return 'Enregistrement impossible, rien n\'a été ajouté : ' + inserted.error
    }
    rec.apply({ eventType: 'INSERT', new: recipe })
    inserted.data.forEach((l) => lin.apply({ eventType: 'INSERT', new: l }))
    return null
  }

  async function editRecipe(id, base, lines) {
    const old = linesByRecipe.get(id) ?? []
    const updated = await updateRecipe(id, base)
    if (updated.error) return 'Enregistrement impossible : ' + updated.error
    const removed = await deleteLines(id)
    if (removed.error) return 'Enregistrement impossible : ' + removed.error
    const inserted = await insertLines(lines.map((l) => ({ ...l, recipe_id: id })))
    if (inserted.error) {
      const restored = await insertLines(old.map(({ id: _drop, ...l }) => l)) // on remet l'ancienne version
      lin.reload()
      return 'Enregistrement des ingrédients impossible' + (restored.error ? ' (et l\'ancienne liste n\'a pas pu être remise)' : ' (ancienne liste conservée)') + ' : ' + inserted.error
    }
    rec.apply({ eventType: 'UPDATE', new: updated.data })
    old.forEach((l) => lin.apply({ eventType: 'DELETE', old: { id: l.id } }))
    inserted.data.forEach((l) => lin.apply({ eventType: 'INSERT', new: l }))
    return null
  }

  async function removeRecipe(recipe) {
    const result = await deleteRecipe(recipe.id)
    if (result.error) return 'Suppression impossible : ' + result.error
    rec.apply({ eventType: 'DELETE', old: { id: recipe.id } })
    ;(linesByRecipe.get(recipe.id) ?? []).forEach((l) => lin.apply({ eventType: 'DELETE', old: { id: l.id } }))
    return null
  }

  return {
    ingredients, recipes, ingredientsById, linesByRecipe,
    recipesLoading: loading, recipesError: loadError, reloadRecipes: reload,
    saveIngredient, saveRecipe, removeRecipe,
  }
}
