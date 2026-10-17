import { useState } from 'react'
import { daysLeft, formatDateFr, remainingLabel, urgency } from '../lib/expiry'
import { locationLabel } from '../lib/options'
import QuickDateButtons from './QuickDateButtons'

// Une ligne de produit. Couleur = bordure + pastille, mais le texte des jours
// restants est toujours affiché (accessibilité). Un tap sur le produit ouvre la
// correction de la date de péremption (en cas d'erreur de saisie).
export default function ItemRow({ item, onUsed, onThrown, onChangeDate }) {
  const [editing, setEditing] = useState(false)
  const days = daysLeft(item.expires_at)
  const toggle = () => setEditing((e) => !e)

  function pick(date) {
    if (date !== item.expires_at) onChangeDate(item, date)
    setEditing(false)
  }

  return (
    <li className={`item ${urgency(days)}`}>
      <div className="item-main tappable" role="button" tabIndex={0} aria-expanded={editing}
        aria-label={`${item.name} : modifier la date de péremption`}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}>
        <div className="item-info">
          <strong>{item.name}</strong>
          {item.brand && <span className="brand">{item.brand}</span>}
          <span>{item.quantity} {item.unit} · {locationLabel(item.location)}</span>
          <span>{formatDateFr(item.expires_at)} · <b className="remaining">{remainingLabel(days)}</b></span>
        </div>
        <span className="edit-hint" aria-hidden="true">{editing ? '▲' : '✎'}</span>
      </div>
      {editing && (
        <div className="date-edit">
          <p className="date-edit-title">Corriger la date de péremption</p>
          <QuickDateButtons allowPast selectedDate={item.expires_at} onPick={pick} onExact={pick} />
          <button type="button" className="secondary" onClick={() => setEditing(false)}>Fermer</button>
        </div>
      )}
      <div className="item-actions">
        <button className="ok" onClick={() => onUsed(item)}>Utilisé</button>
        <button className="danger" onClick={() => onThrown(item)}>Jeté</button>
      </div>
    </li>
  )
}
