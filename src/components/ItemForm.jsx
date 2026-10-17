import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, LOCATIONS, UNITS } from '../lib/options'

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
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Ajouter un produit</h2>
      {notice && <p className="notice" role="status">{notice}</p>}
      {form.barcode && <p className="barcode-line">Code-barres : {form.barcode}</p>}
      {form.image_url && (
        <div className="preview">
          <img src={form.image_url} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <button type="button" className="secondary small" onClick={() => setForm({ ...form, image_url: '' })}>
            Retirer la photo
          </button>
        </div>
      )}
      <label>Nom
        <input ref={nameRef} value={form.name} onChange={set('name')}
          placeholder="Ex. Yaourts nature" />
      </label>
      <label>Marque
        <input value={form.brand} onChange={set('brand')} placeholder="Facultatif" />
      </label>
      <div className="row">
        <label>Quantité
          <input type="number" inputMode="decimal" min="0" step="any"
            value={form.quantity} onChange={set('quantity')} />
        </label>
        <label>Unité
          <select value={form.unit} onChange={set('unit')}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label>Emplacement
          <select value={form.location} onChange={set('location')}>
            {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </label>
        <label>Catégorie
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <label>Date de péremption
        <input ref={dateRef} type="date" value={form.expires_at} onChange={set('expires_at')} />
      </label>
      <button type="submit" disabled={saving}>{saving ? 'Ajout…' : 'Ajouter'}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}
