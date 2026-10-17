import { useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useItems } from '../lib/useItems'
import { saveToCache } from '../lib/products'
import ConnectionDot from './ConnectionDot'
import ItemForm from './ItemForm'
import ItemList from './ItemList'
import ScanPanel from './ScanPanel'

// Écran principal. La liste vient de useItems (chargement + temps réel) ;
// ici on ne gère que les actions, en mise à jour optimiste.
export default function Inventory() {
  const { items, loading, loadError, connection, reload, apply } = useItems()
  const [actionError, setActionError] = useState('') // erreur d'écriture
  const [filter, setFilter] = useState('all')
  const [prefill, setPrefill] = useState(null) // dernier produit scanné
  const scanRef = useRef(null) // champ de scan, toujours remis en focus
  const scanCount = useRef(0)

  // Retourne un message d'erreur (ou null) pour que le formulaire l'affiche.
  // La ligne renvoyée par la base est ajoutée tout de suite ; l'écho temps réel
  // (même id) est dédoublonné.
  async function addItem(item) {
    const { data, error } = await supabase.from('items').insert(item).select().single()
    if (error) return 'Ajout impossible : ' + error.message
    apply({ eventType: 'INSERT', new: data })
    // Mes valeurs validées priment sur Open Food Facts pour les scans suivants.
    // Sans attendre, et sans jamais bloquer l'ajout.
    if (item.barcode) saveToCache(item)
    return null
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

  return (
    <main className="page">
      <header className="top">
        <h1>Frigo</h1>
        <ConnectionDot state={connection} />
        <button className="secondary small" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
      </header>
      <ScanPanel inputRef={scanRef}
        onResult={(r) => setPrefill({ ...r, id: ++scanCount.current })} />
      <ItemForm onAdd={addItem} prefill={prefill} onAdded={() => scanRef.current?.focus()} />
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
          onUsed={(i) => setStatus(i, 'used')} onThrown={(i) => setStatus(i, 'thrown')} />
      )}
    </main>
  )
}
