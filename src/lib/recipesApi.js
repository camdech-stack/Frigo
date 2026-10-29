import { supabase } from '../supabaseClient'

// Écritures de la base de recettes. Chaque fonction retourne { data } ou { error: message }.
const fail = (error) => ({ error: error.message ?? String(error) })

export async function insertIngredients(list) {
  const { data, error } = await supabase.from('ingredients').insert(list).select()
  return error ? fail(error) : { data }
}

export async function updateIngredient(id, patch) {
  const { data, error } = await supabase.from('ingredients').update(patch).eq('id', id).select().single()
  return error ? fail(error) : { data }
}

export async function insertRecipe(recipe) {
  const { data, error } = await supabase.from('recipes').insert(recipe).select().single()
  return error ? { ...fail(error), code: error.code } : { data }
}

export async function updateRecipe(id, patch) {
  const { data, error } = await supabase.from('recipes').update(patch).eq('id', id).select().single()
  return error ? fail(error) : { data }
}

// Suppression d'une recette ; ses lignes d'ingrédients partent avec (delete cascade).
export async function deleteRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  return error ? fail(error) : { data: true }
}

export async function insertLines(lines) {
  if (!lines.length) return { data: [] }
  const { data, error } = await supabase.from('recipe_ingredients').insert(lines).select()
  return error ? fail(error) : { data }
}

export async function deleteLines(recipeId) {
  const { error } = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
  return error ? fail(error) : { data: true }
}

export async function currentUserEmail() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user?.email ?? null
  } catch { return null }
}
