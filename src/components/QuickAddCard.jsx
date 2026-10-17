import { useEffect, useRef, useState } from 'react'
import { LOCATIONS } from '../lib/options'
import { buildItem, suggestFor } from '../lib/quickAdd'
import { formatDateFr } from '../lib/dates'
import QuantityStepper from './QuantityStepper'
import QuickDateButtons from './QuickDateButtons'
import SuggestionNote from './SuggestionNote'

// Carte de saisie rapide affichée après un scan (mode normal).
//  - scan : { code, product, shelfDays, notice } ; product = null si inconnu ;
//  - onAdd(item) : retourne un message d'erreur ou null ; la carte est fermée par l'appelant ;
//  - suggestRef : reçoit la fonction « valider la date suggérée » (touche Entrée du champ de scan).
export default function QuickAddCard({ scan, onAdd, onCancel, suggestRef }) {
  const p = scan.product
  const [name, setName] = useState(p?.name ?? '')
  const [quantity, setQuantity] = useState(1)
  const [location, setLocation] = useState('frigo')
  const [exactDate, setExactDate] = useState('') // date choisie via « Date exacte », pas encore validée
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef(null)
  const category = p?.category ?? 'autre'

  const suggestion = suggestFor({ cachedDays: scan.shelfDays, location, category })
  const touched = Boolean(exactDate) // la date a été choisie à la main : plus d'étiquette « estimation »

  // Produit inconnu : le nom est à saisir, on y place le focus.
  useEffect(() => {
    if (!name.trim()) nameRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function commit(date) {
    if (saving) return
    if (!name.trim()) {
      setError('Saisis le nom du produit.')
      nameRef.current?.focus()
      return
    }
    setSaving(true)
    setError('')
    const message = await onAdd(buildItem({
      name, brand: p?.brand, barcode: scan.code, image_url: p?.image_url, category, quantity, location,
    }, date))
    setSaving(false)
    if (message) setError(message) // la carte reste ouverte pour réessayer
  }

  // Toujours la version la plus récente (quantité, nom…) pour la touche Entrée.
  useEffect(() => {
    suggestRef.current = () => commit(suggestion.date)
    return () => { suggestRef.current = null }
  })

  return (
    <section className="panel quick" aria-label="Ajout rapide">
      <div className="item-main">
        {p?.image_url && <img className="thumb" src={p.image_url} alt="" referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.style.display = 'none' }} />}
        <div className="item-info">
          {p?.name ? <strong>{p.name}</strong> : null}
          {p?.brand && <span className="brand">{p.brand}</span>}
          <span className="barcode-line">Code-barres : {scan.code}</span>
        </div>
      </div>
      {scan.notice && <p className="notice" role="status">{scan.notice}</p>}
      {!p?.name && (
        <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nom du produit" aria-label="Nom du produit" />
      )}

      <div className="quick-line">
        <span>Quantité</span>
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </div>
      <div className="quick-line">
        <span>Emplacement</span>
        <div className="seg" role="group" aria-label="Emplacement">
          {LOCATIONS.map((l) => (
            <button key={l.value} type="button" className={'chip' + (location === l.value ? ' active' : '')}
              onClick={() => setLocation(l.value)}>{l.label}</button>
          ))}
        </div>
      </div>

      <QuickDateButtons disabled={saving} selectedDate={exactDate}
        onPick={(date) => commit(date)} onExact={setExactDate} />

      {exactDate ? (
        <button type="button" className="big ok" disabled={saving} onClick={() => commit(exactDate)}>
          Ajouter le {formatDateFr(exactDate)}
        </button>
      ) : null}
      <button type="button" className={'big' + (exactDate ? ' secondary' : '')} disabled={saving}
        onClick={() => commit(suggestion.date)}>
        Ajouter (suggéré : {suggestion.dateLabel})
      </button>
      {!touched && (
        <p className="suggest-note"><SuggestionNote source={suggestion.source} category={category} days={suggestion.days} /></p>
      )}

      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="secondary" onClick={onCancel} disabled={saving}>Annuler</button>
    </section>
  )
}
