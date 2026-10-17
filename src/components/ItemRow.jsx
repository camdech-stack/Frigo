import { useState } from 'react'
import { daysLeft, formatDateFr, remainingLabel, urgency } from '../lib/expiry'
import { locationLabel } from '../lib/options'

// Vignette en chargement différé ; si l'image échoue, elle disparaît sans casser la mise en page.
function Thumb({ url }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) return null
  return <img className="thumb" src={url} alt="" loading="lazy" decoding="async"
    referrerPolicy="no-referrer" onError={() => setFailed(true)} />
}

// Une ligne de produit. Couleur = bordure + pastille, mais le texte des jours
// restants est toujours affiché (accessibilité).
export default function ItemRow({ item, onUsed, onThrown }) {
  const days = daysLeft(item.expires_at)
  return (
    <li className={`item ${urgency(days)}`}>
      <div className="item-main">
        <Thumb url={item.image_url} />
        <div className="item-info">
          <strong>{item.name}</strong>
          {item.brand && <span className="brand">{item.brand}</span>}
          <span>{item.quantity} {item.unit} · {locationLabel(item.location)}</span>
          <span>{formatDateFr(item.expires_at)} · <b className="remaining">{remainingLabel(days)}</b></span>
        </div>
      </div>
      <div className="item-actions">
        <button className="ok" onClick={() => onUsed(item)}>Utilisé</button>
        <button className="danger" onClick={() => onThrown(item)}>Jeté</button>
      </div>
    </li>
  )
}
