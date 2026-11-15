import { useEffect, useRef, useState } from 'react'
import { useInventory } from '../lib/InventoryContext'
import { toStockUnit } from '../lib/quantity'
import { LOCATIONS, UNITS } from '../lib/options'
import { buildItem, suggestFor } from '../lib/quickAdd'
import { formatDateFr } from '../lib/dates'
import CategoryTile from './CategoryTile'
import ItemIngredient from './ItemIngredient'
import QuantityStepper from './QuantityStepper'
import QuickDateButtons from './QuickDateButtons'
import SuggestionNote from './SuggestionNote'

// Carte de saisie rapide affichée après un scan (mode normal).
//  - scan : { code, product, shelfDays, notice } ; product = null si inconnu ;
//  - scan.ingredientId : ingrédient déjà associé à ce code-barres (cache) ; scan.product.pack : contenance connue ;
//  - onAdd(item, ingredient, pack) : retourne un message d'erreur ou null ; la carte est fermée par l'appelant ;
//  - suggestRef : reçoit la fonction « valider la date suggérée » (touche Entrée du champ de scan).
export default function QuickAddCard({ scan, onAdd, onCancel, suggestRef }) {
  const p = scan.product
  const [name, setName] = useState(p?.name ?? '')
  const [quantity, setQuantity] = useState(1)
  const [location, setLocation] = useState('frigo')
  const [exactDate, setExactDate] = useState('') // date choisie via « Date exacte », pas encore validée
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { ingredients } = useInventory()
  // Ingrédient : celui mémorisé pour ce code-barres (s'il existe encore au catalogue), sinon à choisir.
  const [ingredient, setIngredient] = useState({
    ingredientId: ingredients.some((i) => i.id === scan.ingredientId) ? scan.ingredientId : null, create: null,
  })
  // Contenance d'un produit : Open Food Facts ou mémorisée si connue, sinon à saisir (1 pièce par défaut).
  const [packQty, setPackQty] = useState(p?.pack ? String(p.pack.quantity) : '1')
  const [packUnit, setPackUnit] = useState(p?.pack?.unit ?? 'pièce')
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
    const pack = toStockUnit(packQty.replace(',', '.'), packUnit)
    if (!pack || !(pack.quantity > 0)) return setError('Le contenu d\'un produit doit être supérieur à 0.')
    setSaving(true)
    setError('')
    // quantity = nombre de produits ; le stock est enregistré en unités réelles (2 × 500 g = 1000 g).
    const total = toStockUnit(quantity * pack.quantity, pack.unit)
    const message = await onAdd(buildItem({
      name, brand: p?.brand, barcode: scan.code, image_url: p?.image_url, category,
      quantity: total.quantity, unit: total.unit, location,
    }, date), ingredient, pack)
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
      <div className="summary">
        <CategoryTile category={category} size="lg" />
        <div className="summary-text">
          <span className="label-caps">Code-barres lu</span>
          {p?.name ? <strong className="summary-name">{p.name}</strong> : null}
          {p?.brand && <span className="summary-sub">{p.brand}</span>}
          <span className="summary-sub">{scan.code}</span>
        </div>
      </div>
      {scan.notice && <p className="notice" role="status">{scan.notice}</p>}
      {!p?.name && (
        <input ref={nameRef} className="field" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nom du produit" aria-label="Nom du produit" />
      )}

      <div className="quick-line">
        <span className="question">Quantité</span>
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </div>
      <div className="row pack-line">
        <label>Contenu d'un produit
          <input className="field" type="number" inputMode="decimal" min="0" step="any"
            value={packQty} onChange={(e) => setPackQty(e.target.value)} />
        </label>
        <label>Unité
          <select className="field" value={packUnit} onChange={(e) => setPackUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <ItemIngredient name={name} brand={p?.brand} value={ingredient} onChange={setIngredient} catalog={ingredients} />
      <p className="question">Où tu le ranges ?</p>
      <div className="filters equal" role="group" aria-label="Emplacement">
        {LOCATIONS.map((l) => (
          <button key={l.value} type="button" className={'chip' + (location === l.value ? ' active' : '')}
            aria-pressed={location === l.value} onClick={() => setLocation(l.value)}>{l.label}</button>
        ))}
      </div>

      <p className="question">Il se garde combien de temps ?</p>
      <QuickDateButtons disabled={saving} selectedDate={exactDate}
        onPick={(date) => commit(date)} onExact={setExactDate} />

      <div className="actions-bar">
        {exactDate ? (
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => commit(exactDate)}>
            Ajouter le {formatDateFr(exactDate)}
          </button>
        ) : null}
        <button type="button" className={'btn ' + (exactDate ? 'btn-secondary' : 'btn-primary')} disabled={saving}
          onClick={() => commit(suggestion.date)}>
          Ajouter (suggéré : {suggestion.dateLabel})
        </button>
        {!touched && (
          <p className="suggest-note"><SuggestionNote source={suggestion.source} category={category} days={suggestion.days} /></p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button type="button" className="btn btn-text" onClick={onCancel} disabled={saving}>Annuler</button>
      </div>
    </section>
  )
}
