import { useInventory } from '../lib/InventoryContext'
import ItemList from './ItemList'

// Inventaire : liste des produits avec ses états (chargement, erreur).
// Le filtre vient du Shell (il est aussi affiché dans le rail iPad) ; la liste vient du provider.
export default function ItemsView({ filter, onFilter }) {
  const { items, loading, loadError, reload } = useInventory()
  return (
    <>
      <h2 className="sr-only">Inventaire</h2>
      {loading ? (
        <p className="empty">Chargement…</p>
      ) : loadError ? (
        <div className="panel">
          <p className="error" role="alert">{loadError}</p>
          <button className="btn btn-primary" onClick={() => reload()}>Réessayer</button>
        </div>
      ) : (
        <ItemList items={items} filter={filter} onFilter={onFilter} />
      )}
    </>
  )
}
