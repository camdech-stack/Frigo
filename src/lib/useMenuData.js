import { useMemo } from 'react'
import { useLiveTable } from './useLiveTable'
import { deleteEntry, insertEntry, replaceMenu, updateEntry } from './menuApi'

// Menu enregistré : entrées `prevu` en temps réel (même menu sur iPhone et iPad) et écritures.
// Une entrée = recette + personnes ; les produits utilisés et les manquants affichés sont recalculés
// à partir du stock (voir MenuView), les colonnes utilise / manque / note gardent la photo de l'enregistrement.
export function useMenuData() {
  const live = useLiveTable('menu_entries', 'created_at')
  const entries = useMemo(
    () => live.rows.filter((e) => e.status === 'prevu').sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)),
    [live.rows],
  )

  // Remplace tout le menu `prevu`. `rows` : [{ recipe_id, personnes, utilise, manque, note }].
  // Les dates de création sont décalées d'une milliseconde par ligne pour garder l'ordre choisi.
  async function replaceMenuEntries(rows) {
    const base = Date.now()
    const full = rows.map((r, i) => ({ ...r, status: 'prevu', created_at: new Date(base + i).toISOString() }))
    const result = await replaceMenu(full, entries.map(({ id: _id, ...e }) => e))
    if (result.error) { live.reload(); return 'Enregistrement du menu impossible : ' + result.error }
    entries.forEach((e) => live.apply({ eventType: 'DELETE', old: { id: e.id } }))
    result.data.forEach((e) => live.apply({ eventType: 'INSERT', new: e }))
    return null
  }

  async function addMenuEntry(row) {
    const result = await insertEntry({ ...row, status: 'prevu' })
    if (result.error) return 'Ajout impossible : ' + result.error
    live.apply({ eventType: 'INSERT', new: result.data })
    return null
  }

  async function patchMenuEntry(id, patch) {
    const result = await updateEntry(id, patch)
    if (result.error) return 'Modification impossible : ' + result.error
    live.apply({ eventType: 'UPDATE', new: result.data })
    return null
  }

  async function removeMenuEntry(id) {
    const result = await deleteEntry(id)
    if (result.error) return 'Suppression impossible : ' + result.error
    live.apply({ eventType: 'DELETE', old: { id } })
    return null
  }

  return {
    menuEntries: entries, menuLoading: live.loading, menuError: live.loadError, reloadMenu: live.reload,
    replaceMenuEntries, addMenuEntry, patchMenuEntry, removeMenuEntry,
  }
}
