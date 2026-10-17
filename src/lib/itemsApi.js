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
