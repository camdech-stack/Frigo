import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInventory } from '../lib/InventoryContext'
import { searchByName } from '../lib/matchIngredient'
import { STOCK_UNITS } from '../lib/options'
import RayonInput from './RayonInput'

const num = (s) => (String(s).trim() === '' ? null : Number(String(s).replace(',', '.')))

// Formulaire de modification d'un ingrédient (le nom ne change pas : les recettes s'y rattachent par id).
function EditForm({ ing, catalog, onSave, onCancel }) {
  const [rayon, setRayon] = useState(ing.rayon ?? '')
  const [unite, setUnite] = useState(ing.unite)
  const [basique, setBasique] = useState(ing.basique)
  const [format, setFormat] = useState(ing.format_achat ?? '')
  const [prix, setPrix] = useState(ing.prix_estime ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const format_achat = num(format)
    const prix_estime = num(prix)
    if ((format_achat !== null && !(format_achat > 0)) || (prix_estime !== null && !(prix_estime >= 0))) {
      return setError('Format d\'achat et prix doivent être des nombres positifs (ou vides).')
    }
    setSaving(true)
    setError('')
    const message = await onSave(ing.id, { rayon: rayon.trim() || 'autre', unite, basique, format_achat, prix_estime })
    setSaving(false)
    if (message) setError(message)
    else onCancel()
  }

  return (
    <form className="cat-edit" onSubmit={submit}>
      <div className="row">
        <label>Rayon
          <RayonInput value={rayon} onChange={setRayon} catalog={catalog} />
        </label>
        <label>Unité de stock
          <select className="field" value={unite} onChange={(e) => setUnite(e.target.value)}>
            {STOCK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <label className="switch">
        <input type="checkbox" role="switch" checked={basique} onChange={(e) => setBasique(e.target.checked)} />
        <span className="switch-track" aria-hidden="true" />
        Basique (jamais compté comme manquant)
      </label>
      <div className="row">
        <label>Format d'achat ({unite})
          <input className="field" inputMode="decimal" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Facultatif" />
        </label>
        <label>Prix estimé (€)
          <input className="field" inputMode="decimal" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Facultatif" />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="ing-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Annuler</button>
      </div>
    </form>
  )
}

// Réglages > Catalogue d'ingrédients : liste, recherche, modification des champs optionnels.
export default function CatalogView() {
  const { ingredients, recipesLoading, recipesError, reloadRecipes, saveIngredient } = useInventory()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // id de l'ingrédient en cours de modification
  const shown = useMemo(() => searchByName(query, ingredients), [query, ingredients])

  return (
    <>
      <h2 className="view-title">Catalogue d'ingrédients</h2>
      <p className="back"><Link to="/reglages">← Réglages</Link></p>
      {recipesLoading ? <p className="empty">Chargement…</p> : recipesError ? (
        <div className="panel">
          <p className="error" role="alert">{recipesError}</p>
          <button className="btn btn-primary" onClick={reloadRecipes}>Réessayer</button>
        </div>
      ) : (
        <>
          <section className="panel">
            <input className="field" type="search" aria-label="Rechercher un ingrédient" placeholder="Rechercher un ingrédient"
              value={query} onChange={(e) => setQuery(e.target.value)} />
            <p className="hint" role="status">{shown.length} ingrédient{shown.length > 1 ? 's' : ''}</p>
          </section>
          {shown.length === 0 && <p className="empty">Aucun ingrédient{ingredients.length === 0 ? ' dans le catalogue pour l\'instant' : ' ne correspond'}.</p>}
          <ul className="recipes cat-list">
            {shown.map((i) => (
              <li key={i.id} className="recipe-card">
                <h3 className="recipe-title">{i.nom}</h3>
                <p className="recipe-meta">
                  <span>{i.rayon}</span><span>stock en {i.unite}</span>
                  {i.basique && <span>basique</span>}
                  {i.format_achat != null && <span>format {i.format_achat} {i.unite}</span>}
                  {i.prix_estime != null && <span>{i.prix_estime} €</span>}
                </p>
                {editing === i.id
                  ? <EditForm ing={i} catalog={ingredients} onSave={saveIngredient} onCancel={() => setEditing(null)} />
                  : <div className="recipe-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(i.id)}>Modifier</button></div>}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
