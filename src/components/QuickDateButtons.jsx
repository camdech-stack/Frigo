import { useEffect, useRef, useState } from 'react'
import { daysLeft, daysTag, urgency } from '../lib/expiry'
import { durationOptions } from '../lib/quickAdd'
import { todayIso } from '../lib/dates'

// Boutons +3 j / +1 sem / +2 sem / +1 mois (DESIGN.md §6.13) : titre, date obtenue, et étiquette du statut
// résultant (« 7 jours », colorée selon la règle de péremption), puis « Autre date ».
//  - onPick(date) : tap sur une durée ;
//  - onExact(date) : une date exacte vient d'être choisie dans le sélecteur natif ;
//  - selectedDate : bouton mis en évidence (encre) s'il donne cette date ;
//  - compact : version réduite (lignes de la file de rangement) ;
//  - hideExact : sans « Autre date » (le formulaire d'ajout a déjà son propre champ date).
export default function QuickDateButtons({ onPick, onExact, selectedDate, compact = false, disabled = false, allowPast = false, hideExact = false }) {
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
        {options.map((o) => {
          const days = daysLeft(o.date)
          return (
            <button key={o.id} type="button" disabled={disabled}
              className={'qd-btn' + (o.date === selectedDate ? ' selected' : '')}
              aria-pressed={o.date === selectedDate}
              onClick={() => onPick(o.date)}>
              <span className="qd-label">{o.label}</span>
              <span className="qd-date">{o.dateLabel}</span>
              <span className={'qd-tag ' + urgency(days)}>{daysTag(days)}</span>
            </button>
          )
        })}
      </div>
      {!hideExact && (
        <button type="button" disabled={disabled} className="btn btn-secondary qd-exact" onClick={() => setShowExact(true)}>
          Autre date
        </button>
      )}
      {showExact && (
        <input ref={exactRef} type="date" className="field qd-input" aria-label="Autre date"
          min={allowPast ? undefined : todayIso()} defaultValue={selectedDate || ''}
          onChange={(e) => e.target.value && onExact(e.target.value)} />
      )}
    </div>
  )
}
