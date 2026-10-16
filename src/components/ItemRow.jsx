import { daysLeft, formatDateFr, remainingLabel, urgency } from '../lib/expiry'
import { locationLabel } from '../lib/options'

// Une ligne de produit. Couleur = bordure + pastille, mais le texte des jours
// restants est toujours affiché (accessibilité).
export default function ItemRow({ item, onUsed, onThrown }) {
  const days = daysLeft(item.expires_at)
  return (
    <li className={`item ${urgency(days)}`}>
      <div className="item-info">
        <strong>{item.name}</strong>
        <span>{item.quantity} {item.unit} · {locationLabel(item.location)}</span>
        <span>{formatDateFr(item.expires_at)} · <b className="remaining">{remainingLabel(days)}</b></span>
      </div>
      <div className="item-actions">
        <button className="ok" onClick={() => onUsed(item)}>Utilisé</button>
        <button className="danger" onClick={() => onThrown(item)}>Jeté</button>
      </div>
    </li>
  )
}
