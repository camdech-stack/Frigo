import { useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useItems } from '../lib/useItems'
import { useRangementQueue } from '../lib/useRangementQueue'
import { deleteItem, insertItem, insertItems } from '../lib/itemsApi'
import { saveToCache } from '../lib/products'
import { rowsToItems } from '../lib/queue'
import ConnectionDot from './ConnectionDot'
import ItemForm from './ItemForm'
import ItemList from './ItemList'
import QuickAddCard from './QuickAddCard'
import RangementQueue from './RangementQueue'
import ScanPanel from './ScanPanel'
import Toast from './Toast'

const RANGEMENT_KEY = 'frigo.rangementMode'
const UNDO_MS = 6000 // durée du bouton « Annuler » après un ajout rapide
const TOAST_MS = 4000

function loadRangementMode() {
  try { return localStorage.getItem(RANGEMENT_KEY) === 'on' } catch { return false }
}

// Écran principal. La liste vient de useItems (chargement + temps réel) ;
// ici on ne gère que les actions, en mise à jour optimiste.
export default function Inventory() {
  const { items, loading, loadError, connection, reload, apply } = useItems()
  const [actionError, setActionError] = useState('') // erreur d'écriture
  const [filter, setFilter] = useState('all')
  const [card, setCard] = useState(null) // produit scanné en cours de saisie rapide (mode normal)
  const [rangement, setRangement] = useState(loadRangementMode)
  const [queueBusy, setQueueBusy] = useState(false)
  const [queueError, setQueueError] = useState('')
  const [toast, setToast] = useState(null)
  const queue = useRangementQueue()
  const scanRef = useRef(null) // champ de scan, toujours remis en focus
  const scanCount = useRef(0)
  const suggestRef = useRef(null) // « valider la date suggérée » de la carte ouverte

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
    scanRef.current?.focus()
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
    scanRef.current?.focus()
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
    scanRef.current?.focus()
  }

  function toggleRangement(on) {
    setRangement(on)
    try { localStorage.setItem(RANGEMENT_KEY, on ? 'on' : 'off') } catch { /* stockage indisponible */ }
    scanRef.current?.focus()
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

  return (
    <main className="page">
      <header className="top">
        <h1>Frigo</h1>
        <ConnectionDot state={connection} />
        <button className="secondary small" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
      </header>
      <label className="switch">
        <input type="checkbox" role="switch" checked={rangement} onChange={(e) => toggleRangement(e.target.checked)} />
        <span className="switch-track" aria-hidden="true" />
        Mode rangement
      </label>
      <ScanPanel inputRef={scanRef} rangement={rangement} blocked={Boolean(card)}
        onQueueScan={queue.scan}
        onEmptyEnter={() => { if (!suggestRef.current) return false; suggestRef.current(); return true }}
        onResult={(r) => setCard({ ...r, id: ++scanCount.current })} />
      {card && (
        <QuickAddCard key={card.id} scan={card} suggestRef={suggestRef} onAdd={quickAdd}
          onCancel={() => { setCard(null); scanRef.current?.focus() }} />
      )}
      {(rangement || queue.rows.length > 0) && (
        <RangementQueue rows={queue.rows} onPatch={queue.patch} onRemove={queue.remove}
          onAddAll={addAll} adding={queueBusy} error={queueError} />
      )}
      <ItemForm onAdd={addItem} onAdded={() => scanRef.current?.focus()} />
      {actionError && <p className="error" role="alert">{actionError}</p>}
      {loading ? (
        <p className="empty">Chargement…</p>
      ) : loadError ? (
        <div className="panel">
          <p className="error" role="alert">{loadError}</p>
          <button onClick={() => reload()}>Réessayer</button>
        </div>
      ) : (
        <ItemList items={items} filter={filter} onFilter={setFilter}
          onChangeDate={changeDate} onUsed={(i) => setStatus(i, 'used')} onThrown={(i) => setStatus(i, 'thrown')} />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  )
}
