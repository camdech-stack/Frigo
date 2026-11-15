import { supabase } from '../supabaseClient'

// Écritures sur la table items. Chaque fonction retourne { data } ou { error: 'message' }.

export async function insertItem(item) {
  const { data, error } = await supabase.from('items').insert(item).select().single()
  return error ? { error: error.message } : { data }
}

// Insert en lot : UNE requête, donc tout ou rien (rien n'est créé si elle échoue).
export async function insertItems(items) {
  const { data, error } = await supabase.from('items').insert(items).select()
  return error ? { error: error.message } : { data }
}

// Suppression définitive : réservée à l'annulation d'un ajout qui vient d'être fait.
export async function deleteItem(id) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  return error ? { error: error.message } : {}
}

// Modification d'un produit (quantité, statut, ingrédient…).
export async function updateItem(id, patch) {
  const { error } = await supabase.from('items').update(patch).eq('id', id)
  return error ? { error: error.message } : {}
}

// Journal des utilisations et jets (table item_events). action : 'utilise' | 'jete' | 'cuisine' (avec recipe_id).
// Retourne l'id de la ligne créée (utile pour l'annuler).
export async function insertEvent({ item_id, action, quantite, unite, recipe_id = null }) {
  const { data, error } = await supabase.from('item_events').insert({ item_id, action, quantite, unite, recipe_id }).select('id').single()
  return error ? { error: error.message } : { id: data.id }
}

// Retire une ligne du journal : seulement pour « Annuler » juste après avoir cuisiné.
export async function deleteEvent(id) {
  const { error } = await supabase.from('item_events').delete().eq('id', id)
  return error ? { error: error.message } : {}
}
