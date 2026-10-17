import { daysLeft, formatDateFr, remainingLabel } from '../lib/expiry'
import { locationLabel } from '../lib/options'
import CategoryTile from './CategoryTile'
import ExpiryBadge from './ExpiryBadge'

// Ligne produit (DESIGN.md §6.3) : un seul bouton = tuile d'icône, nom + détail, pastille.
// Le tap ouvre la feuille d'actions (Utilisé / Jeté / corriger la date).
export default function ProductRow({ item, today, onOpen }) {
  const days = item.expires_at ? daysLeft(item.expires_at, today) : null
  const label = days === null ? 'sans date' : remainingLabel(days)
  return (
    <li>
      <button type="button" className="row" onClick={() => onOpen(item.id)}
        aria-label={`${item.name}, ${label} : ouvrir les actions`}>
        <CategoryTile category={item.category} />
        <span className="row-main">
          <strong className="row-name">{item.name}</strong>
          <span className="row-detail">{locationLabel(item.location)} · {item.quantity} {item.unit}</span>
        </span>
        <ExpiryBadge days={days} />
      </button>
    </li>
  )
}
