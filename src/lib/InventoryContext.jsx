import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useItems } from './useItems'
import { useRangementQueue } from './useRangementQueue'
import { deleteItem, insertItem, insertItems } from './itemsApi'
import { saveToCache } from './products'
import { rowsToItems } from './queue'
import { useWakeLock } from './useWakeLock'
import { setUpdateBusy } from './updateGate'

const RANGEMENT_KEY = 'frigo.rangementMode'
const KEYBOARD_KEY = 'frigo.screenKeyboard'
const UNDO_MS = 6000 // durée du bouton « Annuler » après un ajout rapide
const TOAST_MS = 4000

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
  async function insertAndApply(item) {
    const result = await insertItem(item)
    if (result.error) return { error: 'Ajout impossible : ' + result.error }
    apply({ eventType: 'INSERT', new: result.data })
    // Mes valeurs validées (et la durée choisie) priment pour les scans suivants.
    // Sans attendre, et sans jamais bloquer l'ajout.
    if (item.barcode) saveToCache(item)
    return result
  }

  // Formulaire manuel : retourne un message d'erreur (ou null).
  async function addItem(item) {
    return (await insertAndApply(item)).error ?? null
  }

  // Carte de saisie rapide : ajout, toast « Annuler », fermeture, retour au champ de scan.
  async function quickAdd(item) {
    const result = await insertAndApply(item)
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
    result.data.filter((r) => r.barcode).forEach((r) => saveToCache(r))
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

  // Mise à jour optimiste : la ligne disparaît tout de suite ; si l'écriture échoue,
  // on la remet en place et on affiche l'erreur.
  async function setStatus(item, status) {
    setActionError('')
    apply({ eventType: 'UPDATE', new: { ...item, status } })
    const { error } = await supabase.from('items').update({ status }).eq('id', item.id)
    if (error) {
      apply({ eventType: 'UPDATE', new: item })
      setActionError(`Impossible de mettre « ${item.name} » à jour : ${error.message}`)
    }
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
    items, loading, loadError, connection, lastSync, reload, wakeLock,
    actionError, card, setCard, rangement, toggleRangement, keyboard, setKeyboard,
    queue, queueBusy, queueError, addAll,
    toast, setToast, suggestRef, focusScanRef, focusScan, scanCount,
    addItem, quickAdd, changeDate,
    markUsed: (i) => setStatus(i, 'used'),
    markThrown: (i) => setStatus(i, 'thrown'),
  }
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}
