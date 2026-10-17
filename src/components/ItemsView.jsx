import { useState } from 'react'
import { useInventory } from '../lib/InventoryContext'
import ItemList from './ItemList'

// Liste des produits avec ses états (chargement, erreur) : partagée par Aperçu et Inventaire.
// Le filtre est propre à chaque vue ; la liste, elle, vient du provider (rien ne se recharge).
export default function ItemsView({ title }) {
  const { items, loading, loadError, reload, changeDate, markUsed, markThrown } = useInventory()
  const [filter, setFilter] = useState('all')
  return (
    <>
      <h2 className="view-title">{title}</h2>
      {loading ? (
        <p className="empty">Chargement…</p>
      ) : loadError ? (
        <div className="panel">
          <p className="error" role="alert">{loadError}</p>
          <button onClick={() => reload()}>Réessayer</button>
        </div>
      ) : (
        <ItemList items={items} filter={filter} onFilter={setFilter}
          onChangeDate={changeDate} onUsed={markUsed} onThrown={markThrown} />
      )}
    </>
  )
}
