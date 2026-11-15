import { supabase } from '../supabaseClient'

// Écritures de la table menu_entries. Chaque fonction retourne { data } ou { error: message }.
const fail = (error) => ({ error: error.message ?? String(error) })

// Remplace le menu : supprime les entrées `prevu` puis insère les nouvelles.
// Si l'insertion échoue après la suppression, on remet l'ancien menu (`previous`) pour ne rien perdre.
export async function replaceMenu(rows, previous) {
  const del = await supabase.from('menu_entries').delete().eq('status', 'prevu')
  if (del.error) return fail(del.error)
  const ins = await supabase.from('menu_entries').insert(rows).select()
  if (ins.error) {
    if (previous.length) await supabase.from('menu_entries').insert(previous)
    return fail(ins.error)
  }
  return { data: ins.data }
}

export async function insertEntry(row) {
  const { data, error } = await supabase.from('menu_entries').insert(row).select().single()
  return error ? fail(error) : { data }
}

export async function updateEntry(id, patch) {
  const { data, error } = await supabase.from('menu_entries').update(patch).eq('id', id).select().single()
  return error ? fail(error) : { data }
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('menu_entries').delete().eq('id', id)
  return error ? fail(error) : { data: true }
}
