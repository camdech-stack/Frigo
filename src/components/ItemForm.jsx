import { useRef, useState } from 'react'
import { CATEGORIES, LOCATIONS, UNITS } from '../lib/options'

const EMPTY = { name: '', quantity: '1', unit: 'pièce', location: 'frigo', category: 'autre', expires_at: '' }

// Formulaire d'ajout. `onAdd(item)` doit renvoyer un message d'erreur ou null.
export default function ItemForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const nameRef = useRef(null)

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
    })
    setSaving(false)
    if (message) return setError(message) // on garde la saisie pour réessayer
    setForm(EMPTY)
    nameRef.current?.focus() // pour enchaîner les ajouts
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Ajouter un produit</h2>
      <label>Nom
        <input ref={nameRef} value={form.name} onChange={set('name')} autoFocus
          placeholder="Ex. Yaourts nature" />
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
        <input type="date" value={form.expires_at} onChange={set('expires_at')} />
      </label>
      <button type="submit" disabled={saving}>{saving ? 'Ajout…' : 'Ajouter'}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}
