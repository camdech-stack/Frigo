import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useItems } from './useItems'
import { useRangementQueue } from './useRangementQueue'
import { useRecipeData } from './useRecipeData'
import { useMenuData } from './useMenuData'
import { deleteEvent, deleteItem, insertEvent, insertItem, insertItems, updateItem } from './itemsApi'
import { consume } from './quantity'
import { saveToCache } from './products'
import { rowsToItems } from './queue'
import { useWakeLock } from './useWakeLock'
import { setUpdateBusy } from './updateGate'

const RANGEMENT_KEY = 'frigo.rangementMode'
const KEYBOARD_KEY = 'frigo.screenKeyboard'
const UNDO_MS = 6000 // durée du bouton « Annuler » après un ajout rapide
const TOAST_MS = 4000
const COOK_UNDO_MS = 15000 // durée du bouton « Annuler » après « Valider » d'une recette cuisinée

function loadRangementMode() {
  try { return localStorage.getItem(RANGEMENT_KEY) === 'on' } catch { return false }
}

// Réglage mémorisé « clavier à l'écran » (activé par défaut).
function loadKeyboardSetting() {
  try { return localStorage.getItem(KEYBOARD_KEY) !== 'off' } catch { return true }
}

const InventoryContext = createContext(null)

export function useInventory() {
  return useContext(InventoryContext)
}

// Tout ce qui doit survivre à un changement de vue vit ici, au-dessus du routeur :
// liste + canal temps réel (un seul), file du mode rangement, carte de saisie rapide,
// toasts et erreurs. Les vues n'affichent que ce que ce provider expose.
export function InventoryProvider({ children }) {
  const { items, loading, loadError, connection, lastSync, reload, apply } = useItems()
  const [actionError, setActionError] = useState('') // erreur d'écriture
  const [card, setCard] = useState(null) // produit scanné en cours de saisie rapide (mode normal)
  const [rangement, setRangement] = useState(loadRangementMode)
  const [queueBusy, setQueueBusy] = useState(false)
  const [queueError, setQueueError] = useState('')
  const [toast, setToast] = useState(null)
  const [keyboard, setKeyboardState] = useState(loadKeyboardSetting)
  const queue = useRangementQueue()
  const menuData = useMenuData() // menu enregistré (entrées `prevu`), temps réel
  const recipeData = useRecipeData() // catalogue, recettes et leurs lignes, temps réel (vit ici pour survivre aux changements de vue)
  const wakeLock = useWakeLock() // mode « Je cuisine » : vit ici pour survivre aux changements de vue
  // Une saisie ouverte (carte rapide, file de rangement) interdit le rechargement pour mise à jour.
  const hasOpenEntry = card !== null || queue.rows.length > 0
  useEffect(() => { setUpdateBusy(hasOpenEntry) }, [hasOpenEntry])
  const scanCount = useRef(0)
  const suggestRef = useRef(null) // « valider la date suggérée » de la carte ouverte
  // Renseigné par la vue Ajouter seulement quand elle est affichée : ailleurs, null,
  // donc aucune action (ajout, annulation…) ne peut voler le focus.
  const focusScanRef = useRef(null)
  const focusScan = () => focusScanRef.current?.()

  function setKeyboard(on) {
    setKeyboardState(on)
    try { localStorage.setItem(KEYBOARD_KEY, on ? 'on' : 'off') } catch { /* stockage indisponible */ }
  }

  const showToast = (t) => setToast({ id: ++scanCount.current, duration: TOAST_MS, ...t })

  // Insère puis affiche tout de suite la ligne renvoyée par la base ; l'écho temps réel
  // (même id) est dédoublonné. Retourne { data } ou { error }.
  //  ingredient : { ingredientId, create } choisi dans le champ « Ingrédient » (create = à créer maintenant).
  //  pack : contenance d'un produit, mémorisée avec le code-barres.
  async function insertAndApply(item, ingredient = null, pack = null) {
    const resolved = await resolveIngredientId(ingredient)
    if (resolved.error) return { error: resolved.error }
    const row = { ...item, ...(resolved.id && { ingredient_id: resolved.id }) }
    const result = await insertItem(row)
    if (result.error) return { error: 'Ajout impossible : ' + result.error }
    apply({ eventType: 'INSERT', new: result.data })
    // Mes valeurs validées (durée, rattachement à l'ingrédient, contenance) priment pour les scans suivants.
    // Sans attendre, et sans jamais bloquer l'ajout.
    if (row.barcode) saveToCache({ ...row, pack })
    return result
  }

  // Ingrédient choisi -> id (créé dans le catalogue si besoin). { id: null } si aucun choix.
  async function resolveIngredientId(ingredient) {
    if (ingredient?.ingredientId) return { id: ingredient.ingredientId }
    if (ingredient?.create) return recipeData.createIngredient(ingredient.create)
    return { id: null }
  }

  // Formulaire manuel : retourne un message d'erreur (ou null).
  async function addItem(item, ingredient) {
    return (await insertAndApply(item, ingredient)).error ?? null
  }

  // Carte de saisie rapide : ajout, toast « Annuler », fermeture, retour au champ de scan.
  async function quickAdd(item, ingredient, pack) {
    const result = await insertAndApply(item, ingredient, pack)
    if (result.error) return result.error
    const added = result.data
    setCard(null)
    setToast({ id: ++scanCount.current, duration: UNDO_MS, message: 'Ajouté', actionLabel: 'Annuler',
      onAction: () => undoAdd(added) })
    focusScan()
    return null
  }

  // Annulation d'un ajout qui vient d'être fait : seul cas de suppression définitive.
  async function undoAdd(item) {
    apply({ eventType: 'DELETE', old: { id: item.id } })
    const { error } = await deleteItem(item.id)
    if (error) {
      apply({ eventType: 'INSERT', new: item })
      setActionError(`Impossible d'annuler l'ajout de « ${item.name} » : ${error}`)
    }
    focusScan()
  }

  // « Tout ajouter » : une seule requête. En cas d'erreur la file reste intacte.
  async function addAll() {
    if (queueBusy) return
    setQueueBusy(true)
    setQueueError('')
    const rows = queue.rows
    const result = await insertItems(rowsToItems(rows))
    setQueueBusy(false)
    if (result.error) return setQueueError('Ajout impossible, rien n\'a été perdu : ' + result.error)
    result.data.forEach((row) => apply({ eventType: 'INSERT', new: row }))
    const packs = new Map(rows.map((r) => [r.barcode, r.pack]))
    result.data.filter((r) => r.barcode).forEach((r) => saveToCache({ ...r, pack: packs.get(r.barcode) ?? null }))
    queue.clear()
    const n = result.data.length
    showToast({ message: `${n} produit${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}` })
    focusScan()
  }

  function toggleRangement(on) {
    setRangement(on)
    try { localStorage.setItem(RANGEMENT_KEY, on ? 'on' : 'off') } catch { /* stockage indisponible */ }
    focusScan()
  }

  // Journal : une ligne dans item_events. Un échec ne défait pas l'action (déjà faite), mais est signalé.
  async function logEvent(item, action, quantite) {
    const { error } = await insertEvent({ item_id: item.id, action, quantite, unite: item.unit })
    if (error) setActionError(`« ${item.name} » est à jour, mais le journal n'a pas pu être écrit : ${error}`)
  }

  // Mise à jour optimiste : la ligne disparaît tout de suite ; si l'écriture échoue,
  // on la remet en place et on affiche l'erreur. `action` = ligne du journal à écrire ensuite.
  async function setStatus(item, status, action) {
    setActionError('')
    apply({ eventType: 'UPDATE', new: { ...item, status } })
    const { error } = await updateItem(item.id, { status })
    if (error) {
      apply({ eventType: 'UPDATE', new: item })
      return setActionError(`Impossible de mettre « ${item.name} » à jour : ${error}`)
    }
    await logEvent(item, action, item.quantity)
  }

  // « Utilisé en partie » : retire `amount` (dans l'unité du produit). À 0, le produit passe `used`.
  // Retourne un message d'erreur (saisie invalide ou écriture refusée), ou null.
  async function usePartly(item, amount) {
    const result = consume(item.quantity, amount)
    if (!result) return 'Saisis une quantité supérieure à 0.'
    setActionError('')
    const patch = result.remaining > 0 ? { quantity: result.remaining } : { quantity: 0, status: 'used' }
    apply({ eventType: 'UPDATE', new: { ...item, ...patch } })
    const { error } = await updateItem(item.id, patch)
    if (error) {
      apply({ eventType: 'UPDATE', new: item })
      return `Impossible de mettre « ${item.name} » à jour : ${error}`
    }
    await logEvent(item, 'utilise', result.consumed)
    return null
  }

  // Rattache un produit déjà en stock à un ingrédient (écran « Associer mes produits »), et
  // mémorise le rattachement pour son code-barres. Retourne un message d'erreur ou null.
  async function linkItem(item, ingredient) {
    const resolved = await resolveIngredientId(ingredient)
    if (resolved.error) return resolved.error
    if (!resolved.id) return 'Choisis un ingrédient.'
    setActionError('')
    apply({ eventType: 'UPDATE', new: { ...item, ingredient_id: resolved.id } })
    const { error } = await updateItem(item.id, { ingredient_id: resolved.id })
    if (error) {
      apply({ eventType: 'UPDATE', new: item })
      return `Impossible d'associer « ${item.name} » : ${error}`
    }
    if (item.barcode) saveToCache({ ...item, ingredient_id: resolved.id, expires_at: null })
    return null
  }

  // Cuisiner : applique les changements validés (voir changements() dans cook.js), les journalise
  // (action « cuisine » + recipe_id), passe la ligne du menu en `cuisine`. Rien n'est écrit avant l'appel.
  // Si une écriture échoue, tout ce qui avait été fait est remis comme avant.
  // Retourne un message d'erreur, ou null (un toast « Annuler » est alors affiché).
  async function cookEntry(entry, changes) {
    setActionError('')
    const done = [] // { item (avant), eventId }
    const rollback = () => undoCook(null, done)
    for (const { item, consumed, patch } of changes) {
      const upd = await updateItem(item.id, patch)
      if (upd.error) { await rollback(); return `Impossible de mettre « ${item.name} » à jour : ${upd.error}` }
      apply({ eventType: 'UPDATE', new: { ...item, ...patch } })
      const ev = await insertEvent({ item_id: item.id, action: 'cuisine', quantite: consumed, unite: item.unit, recipe_id: entry.recipe_id })
      done.push({ item, eventId: ev.id ?? null })
      if (ev.error) { await rollback(); return `Le journal n'a pas pu être écrit pour « ${item.name} » : ${ev.error}` }
    }
    const message = await patchMenuEntry(entry.id, { status: 'cuisine', cooked_at: new Date().toISOString() })
    if (message) { await rollback(); return message }
    showToast({ message: 'Recette cuisinée, stock mis à jour', duration: COOK_UNDO_MS, actionLabel: 'Annuler',
      onAction: () => undoCook(entry, done) })
    return null
  }

  // « Annuler » : remet les quantités et statuts d'avant, retire les lignes du journal et ramène la recette dans le menu.
  // entry = null lors d'un retour arrière interne (la ligne du menu n'a pas encore changé).
  async function undoCook(entry, done) {
    const problems = []
    for (const { item, eventId } of [...done].reverse()) {
      apply({ eventType: 'UPDATE', new: item })
      const upd = await updateItem(item.id, { quantity: item.quantity, status: item.status })
      if (upd.error) problems.push(`« ${item.name} » : ${upd.error}`)
      if (eventId) await deleteEvent(eventId)
    }
    if (entry) {
      const message = await patchMenuEntry(entry.id, { status: 'prevu', cooked_at: null })
      if (message) problems.push(message)
    }
    if (entry && problems.length) setActionError('Annulation incomplète : ' + problems.join(' ; '))
    else if (entry) showToast({ message: 'Annulé, le stock est restauré' })
  }

  // Correction de la date de péremption : mise à jour optimiste, remise en place si l'écriture échoue.
  async function changeDate(item, expires_at) {
    setActionError('')
    apply({ eventType: 'UPDATE', new: { ...item, expires_at } })
    const { error } = await supabase.from('items').update({ expires_at }).eq('id', item.id)
    if (error) {
      apply({ eventType: 'UPDATE', new: item })
      setActionError(`Impossible de modifier la date de « ${item.name} » : ${error.message}`)
    }
  }

  const value = {
    ...recipeData,
    ...menuData,
    items, loading, loadError, connection, lastSync, reload, wakeLock,
    actionError, card, setCard, rangement, toggleRangement, keyboard, setKeyboard,
    queue, queueBusy, queueError, addAll,
    toast, setToast, suggestRef, focusScanRef, focusScan, scanCount,
    addItem, quickAdd, changeDate, usePartly, linkItem, cookEntry,
    markUsed: (i) => setStatus(i, 'used', 'utilise'),
    markThrown: (i) => setStatus(i, 'thrown', 'jete'),
  }
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}
