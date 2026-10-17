import { useEffect, useRef, useState } from 'react'
import { durationOptions } from '../lib/quickAdd'
import { todayIso } from '../lib/dates'

// Boutons +3 j / +1 sem / +2 sem / +1 mois (avec la date que chacun donne) et « Date exacte ».
//  - onPick(date) : tap sur une durée ;
//  - onExact(date) : une date exacte vient d'être choisie dans le sélecteur natif ;
//  - selectedDate : bouton mis en évidence s'il donne cette date ;
//  - compact : version réduite (lignes de la file de rangement).
export default function QuickDateButtons({ onPick, onExact, selectedDate, compact = false, disabled = false, allowPast = false }) {
  const [showExact, setShowExact] = useState(false)
  const exactRef = useRef(null)
  const options = durationOptions()

  // Ouvre le calendrier natif dès que le champ apparaît (si le navigateur le permet).
  useEffect(() => {
    if (!showExact) return
    try { exactRef.current?.showPicker?.() } catch { /* geste utilisateur requis : le champ reste visible */ }
  }, [showExact])

  return (
    <div className={compact ? 'qd compact' : 'qd'}>
      <div className="qd-grid">
        {options.map((o) => (
          <button key={o.id} type="button" disabled={disabled}
            className={'qd-btn' + (o.date === selectedDate ? ' selected' : '')}
            onClick={() => onPick(o.date)}>
            <span className="qd-label">{o.label}</span>
            <span className="qd-date">{o.dateLabel}</span>
          </button>
        ))}
        <button type="button" disabled={disabled} className="qd-btn exact" onClick={() => setShowExact(true)}>
          <span className="qd-label">Date exacte</span>
        </button>
      </div>
      {showExact && (
        <input ref={exactRef} type="date" className="qd-input" aria-label="Date exacte"
          min={allowPast ? undefined : todayIso()} defaultValue={selectedDate || ''}
          onChange={(e) => e.target.value && onExact(e.target.value)} />
      )}
    </div>
  )
}
