import { Link } from 'react-router-dom'
import { daysLeft, urgency } from '../lib/expiry'
import LocationFilters from './LocationFilters'
import ProductList from './ProductList'

// Inventaire : filtre par emplacement + compteur + sections. `items` est déjà trié.
// Sur iPad paysage les filtres vivent dans le rail (Shell) : ici ils sont masqués par le CSS.
export default function ItemList({ items, filter, onFilter }) {
  const shown = filter === 'all' ? items : items.filter((i) => i.location === filter)
  const soon = shown.filter((i) => i.expires_at && urgency(daysLeft(i.expires_at)) !== 'green').length

  const unlinked = items.filter((i) => !i.ingredient_id).length // produits sans ingrédient (étape 6b)
  return (
    <section>
      {unlinked > 0 && (
        <Link to="/associer" className="notice link-banner">
          {unlinked} produit{unlinked > 1 ? 's ne sont' : ' n\'est'} pas associé{unlinked > 1 ? 's' : ''} à un ingrédient. Associer
        </Link>
      )}
      <LocationFilters className="filters-inline" filter={filter} onFilter={onFilter} />
      <p className="counter">
        {shown.length} produit{shown.length > 1 ? 's' : ''}, {soon} à consommer vite
      </p>
      {shown.length === 0 ? (
        <p className="empty">Rien ici pour l'instant. Ajoute un produit avec « Scanner » ou « + ».</p>
      ) : (
        <ProductList items={shown} />
      )}
    </section>
  )
}
