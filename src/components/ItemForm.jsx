import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, LOCATIONS, UNITS, iconForCategory } from '../lib/options'
import FoodIcon, { tintVar } from './FoodIcon'
import QuickDateButtons from './QuickDateButtons'

const EMPTY = {
  name: '', brand: '', barcode: '', image_url: '',
  quantity: '1', unit: 'pièce', location: 'frigo', category: 'autre', expires_at: '',
}

// Formulaire d'ajout. `onAdd(item)` doit renvoyer un message d'erreur ou null.
// `prefill` ({ id, code, product, notice }) change à chaque scan : le formulaire se
// pré-remplit (champs modifiables) puis le focus va sur la date (ou le nom si inconnu).
// `onAdded()` est appelé après un ajout réussi (pour redonner le focus au champ de scan).
export default function ItemForm({ onAdd, onAdded, prefill }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const nameRef = useRef(null)
  const dateRef = useRef(null)

  useEffect(() => {
    if (!prefill) return
    const p = prefill.product
    setForm({
      ...EMPTY, barcode: prefill.code,
      name: p?.name ?? '', brand: p?.brand ?? '',
      category: p?.category ?? 'autre', image_url: p?.image_url ?? '',
    })
    setError('')
    setNotice(prefill.notice)
    // Après le rendu : date de péremption si on a le nom, sinon le nom à saisir.
    const target = p?.name ? dateRef : nameRef
    setTimeout(() => target.current?.focus(), 0)
  }, [prefill])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    const name = form.name.trim()
    const quantity = Number(form.quantity)
    if (!name) return setError('Le nom est obligatoire.')
    if (!form.expires_at) return setError('La date de péremption est obligatoire.')
    if (!(quantity > 0)) return setError('La quantité doit être supérieure à 0.')

    setSaving(true)
    setError('')
    const message = await onAdd({
      name, quantity, unit: form.unit, location: form.location,
      category: form.category, expires_at: form.expires_at,
      barcode: form.barcode || null, brand: form.brand.trim() || null,
      image_url: form.image_url || null,
    })
    setSaving(false)
    if (message) return setError(message) // on garde la saisie pour réessayer
    setForm(EMPTY)
    setNotice('')
    onAdded?.() // pour enchaîner les ajouts
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>Ajouter à la main</h2>
      {notice && <p className="notice" role="status">{notice}</p>}
      {form.barcode && <p className="barcode-line">Code-barres : {form.barcode}</p>}
      <label>Nom
        <input ref={nameRef} className="field" value={form.name} onChange={set('name')}
          placeholder="Ex. Yaourts nature" />
      </label>
      <label>Marque
        <input className="field" value={form.brand} onChange={set('brand')} placeholder="Facultatif" />
      </label>
      <div className="row">
        <label>Quantité
          <input className="field" type="number" inputMode="decimal" min="0" step="any"
            value={form.quantity} onChange={set('quantity')} />
        </label>
        <label>Unité
          <select className="field" value={form.unit} onChange={set('unit')}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <div className="field-group">
        <span className="field-label" id="loc-label">Emplacement</span>
        <div className="filters equal" role="group" aria-labelledby="loc-label">
          {LOCATIONS.map((l) => (
            <button key={l.value} type="button" className={'chip' + (form.location === l.value ? ' active' : '')}
              aria-pressed={form.location === l.value} onClick={() => setForm({ ...form, location: l.value })}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field-group">
        <span className="field-label" id="cat-label">Catégorie</span>
        <div className="cat-grid" role="group" aria-labelledby="cat-label">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={'cat-tile' + (form.category === c ? ' selected' : '')}
              style={{ background: tintVar(iconForCategory(c)) }} aria-pressed={form.category === c}
              onClick={() => setForm({ ...form, category: c })}>
              <FoodIcon name={iconForCategory(c)} size="var(--cat-icon)" />
              <span>{c}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="field-group">
        <span className="field-label" id="date-label">Date de péremption</span>
        <QuickDateButtons hideExact selectedDate={form.expires_at}
          onPick={(d) => setForm({ ...form, expires_at: d })} onExact={(d) => setForm({ ...form, expires_at: d })} />
        <input ref={dateRef} className="field" type="date" aria-labelledby="date-label"
          value={form.expires_at} onChange={set('expires_at')} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions-bar">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Ajout…' : 'Ajouter'}</button>
      </div>
    </form>
  )
}
