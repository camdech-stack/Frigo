import { useEffect, useRef, useState } from 'react'
import { daysLeft, formatDateFr, remainingLabel } from '../lib/expiry'
import { locationLabel } from '../lib/options'
import CategoryTile from './CategoryTile'
import ExpiryBadge from './ExpiryBadge'
import QuickDateButtons from './QuickDateButtons'

// Feuille d'actions du produit touché (Aperçu et Inventaire) : Utilisé, Jeté, et correction de la
// date de péremption en cas d'erreur de saisie. Mises à jour optimistes faites par le provider.
export default function ItemSheet({ item, onUsed, onThrown, onChangeDate, onClose }) {
  const closeRef = useRef(null)
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const act = (fn) => { fn(item); onClose() }
  const days = item.expires_at ? daysLeft(item.expires_at) : null
  function pickDate(date) {
    if (date !== item.expires_at) onChangeDate(item, date)
    onClose()
  }
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <CategoryTile category={item.category} />
          <div className="row-main">
            <h3 className="sheet-title">{item.name}</h3>
            {item.brand && <span className="row-detail">{item.brand}</span>}
          </div>
          <ExpiryBadge days={days} />
        </div>
        <p className="sheet-info">
          {item.quantity} {item.unit} · {locationLabel(item.location)}
          {days !== null && <> · {formatDateFr(item.expires_at)} ({remainingLabel(days)})</>}
        </p>
        <div className="sheet-actions">
          <button type="button" className="btn btn-ink" onClick={() => act(onUsed)}>Utilisé</button>
          <button type="button" className="btn btn-secondary" onClick={() => act(onThrown)}>Jeté</button>
        </div>
        {onChangeDate && (
          <>
            <button type="button" className="btn btn-secondary" aria-expanded={editing} onClick={() => setEditing((e) => !e)}>
              Corriger la date de péremption
            </button>
            {editing && <QuickDateButtons allowPast selectedDate={item.expires_at} onPick={pickDate} onExact={pickDate} />}
          </>
        )}
        <button type="button" ref={closeRef} className="btn btn-text" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
