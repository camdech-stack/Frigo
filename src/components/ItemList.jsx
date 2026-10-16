import { LOCATIONS } from '../lib/options'
import { daysLeft, urgency } from '../lib/expiry'
import ItemRow from './ItemRow'

// Filtre par emplacement + compteur + liste. `items` est déjà trié.
export default function ItemList({ items, filter, onFilter, onUsed, onThrown }) {
  const shown = filter === 'all' ? items : items.filter((i) => i.location === filter)
  const soon = shown.filter((i) => urgency(daysLeft(i.expires_at)) !== 'green').length

  return (
    <section>
      <div className="filters" role="group" aria-label="Filtrer par emplacement">
        {[{ value: 'all', label: 'Tous' }, ...LOCATIONS].map((f) => (
          <button key={f.value} className={filter === f.value ? 'chip active' : 'chip'}
            aria-pressed={filter === f.value} onClick={() => onFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>
      <p className="counter">
        {shown.length} produit{shown.length > 1 ? 's' : ''}, {soon} à consommer vite
      </p>
      {shown.length === 0 ? (
        <p className="empty">Rien ici pour l'instant 🎉 Ajoute ton premier produit avec le formulaire !</p>
      ) : (
        <ul className="items">
          {shown.map((i) => <ItemRow key={i.id} item={i} onUsed={onUsed} onThrown={onThrown} />)}
        </ul>
      )}
    </section>
  )
}
