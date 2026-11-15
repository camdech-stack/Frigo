import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInventory } from '../lib/InventoryContext'
import { suggestIngredient } from '../lib/matchIngredient'
import IngredientPicker from './IngredientPicker'
import CategoryTile from './CategoryTile'

// Une ligne : produit + suggestion à valider en un tap, ou choix / création dans le catalogue.
function Line({ item, catalog, onLink }) {
  const suggestion = suggestIngredient(item.name, catalog, { brand: item.brand ?? '' })?.ingredient ?? null
  const [choice, setChoice] = useState({ ingredientId: null, create: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const chosen = Boolean(choice.ingredientId || choice.create)

  async function link(ingredient) {
    setBusy(true)
    setError('')
    const message = await onLink(item, ingredient)
    setBusy(false)
    if (message) setError(message) // sinon la ligne disparaît (le produit est maintenant associé)
  }

  return (
    <li className="assoc-line">
      <div className="assoc-head">
        <CategoryTile category={item.category} />
        <span className="row-main">
          <strong className="row-name">{item.name}</strong>
          {item.brand && <span className="row-detail">{item.brand}</span>}
        </span>
      </div>
      {suggestion && !chosen && (
        <button type="button" className="btn btn-primary" disabled={busy}
          onClick={() => link({ ingredientId: suggestion.id, create: null })}>
          Valider : {suggestion.nom}
        </button>
      )}
      <IngredientPicker row={{ nom: item.name, ingredientId: choice.ingredientId, suggested: false, create: choice.create }}
        catalog={catalog} pending={[]}
        onChange={(p) => setChoice({ ingredientId: p.ingredientId ?? null, create: p.create ?? null })} />
      {chosen && (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => link(choice)}>Associer</button>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </li>
  )
}

// Écran « Associer mes produits » : produits en stock sans ingrédient, avec suggestion et validation rapide.
export default function AssociateView() {
  const { items, ingredients, linkItem, loading } = useInventory()
  const todo = items.filter((i) => !i.ingredient_id)
  return (
    <>
      <h2 className="view-title">Associer mes produits</h2>
      <p className="hint">Relier chaque produit à un ingrédient permet de le comparer aux recettes.</p>
      {loading ? (
        <p className="empty">Chargement…</p>
      ) : todo.length === 0 ? (
        <div className="panel">
          <p>Tous tes produits sont associés.</p>
          <Link to="/inventaire" className="btn btn-secondary">Retour à l'inventaire</Link>
        </div>
      ) : (
        <ul className="assoc-list">
          {todo.map((i) => <Line key={i.id} item={i} catalog={ingredients} onLink={linkItem} />)}
        </ul>
      )}
    </>
  )
}
