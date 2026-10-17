import { useEffect, useRef } from 'react'
import { daysLeft, formatDateFr, remainingLabel } from '../lib/expiry'
import { locationLabel } from '../lib/options'

// Petite feuille en bas d'écran : « Utilisé » ou « Jeté » pour le produit touché.
// Mêmes actions que sur la liste (mise à jour optimiste faite par le provider).
export default function OverviewSheet({ item, onUsed, onThrown, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const act = (fn) => { fn(item); onClose() }
  const days = item.expires_at ? daysLeft(item.expires_at) : null
  return (
    <div className="ov-sheet-backdrop" onClick={onClose}>
      <div className="ov-sheet" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => e.stopPropagation()}>
        <h3>{item.name}</h3>
        <p>
          {item.quantity} {item.unit} · {locationLabel(item.location)}
          {days !== null && <> · {formatDateFr(item.expires_at)} ({remainingLabel(days)})</>}
        </p>
        <div className="ov-sheet-actions">
          <button type="button" className="ok" onClick={() => act(onUsed)}>Utilisé</button>
          <button type="button" className="danger" onClick={() => act(onThrown)}>Jeté</button>
        </div>
        <button type="button" ref={closeRef} className="secondary" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
