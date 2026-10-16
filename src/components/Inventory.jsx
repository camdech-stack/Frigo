import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ItemForm from './ItemForm'
import ItemList from './ItemList'

// Écran principal : charge les produits en stock et gère les actions.
export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('') // erreur de lecture
  const [actionError, setActionError] = useState('') // erreur d'écriture
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('items').select('*').eq('status', 'in_stock')
      .order('expires_at', { ascending: true })
    if (error) setLoadError('Impossible de charger les produits : ' + error.message)
    else { setItems(data); setLoadError('') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Retourne un message d'erreur (ou null) pour que le formulaire l'affiche.
  async function addItem(item) {
    const { error } = await supabase.from('items').insert(item)
    if (error) return "Ajout impossible : " + error.message
    await load()
    return null
  }

  // Mise à jour optimiste : la ligne disparaît tout de suite, on recharge si ça échoue.
  async function setStatus(item, status) {
    setActionError('')
    setItems((current) => current.filter((i) => i.id !== item.id))
    const { error } = await supabase.from('items').update({ status }).eq('id', item.id)
    if (error) setActionError(`Impossible de mettre « ${item.name} » à jour : ${error.message}`)
    await load()
  }

  return (
    <main className="page">
      <header className="top">
        <h1>Frigo</h1>
        <button className="secondary small" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
      </header>
      <ItemForm onAdd={addItem} />
      {actionError && <p className="error" role="alert">{actionError}</p>}
      {loading ? (
        <p className="empty">Chargement…</p>
      ) : loadError ? (
        <div className="panel">
          <p className="error" role="alert">{loadError}</p>
          <button onClick={() => { setLoading(true); load() }}>Réessayer</button>
        </div>
      ) : (
        <ItemList items={items} filter={filter} onFilter={setFilter}
          onUsed={(i) => setStatus(i, 'used')} onThrown={(i) => setStatus(i, 'thrown')} />
      )}
    </main>
  )
}
