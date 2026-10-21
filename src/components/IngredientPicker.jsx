import { useState } from 'react'
import { STOCK_UNITS } from '../lib/options'
import { tokens } from '../lib/matchIngredient'
import IngredientList from './IngredientList'
import RayonInput from './RayonInput'

// Choix de l'ingrédient du catalogue pour une ligne de recette : suggestion modifiable,
// liste avec recherche, ou création (rayon, unité de stock, « basique »).
// `row` : { nom, ingredientId, suggested, create }. `onChange(patch)` met la ligne à jour.
// `pending` : ingrédients déjà prévus à la création dans cette recette (réutilisables).
export default function IngredientPicker({ row, catalog, pending, onChange }) {
  const [mode, setMode] = useState('closed') // closed | list | create
  const [draft, setDraft] = useState(null)
  const chosen = catalog.find((i) => i.id === row.ingredientId)

  function openCreate() {
    setDraft(row.create ?? { nom: row.nom.trim().toLowerCase(), rayon: '', unite: 'g', basique: false })
    setMode('create')
  }
  function confirmCreate() {
    if (!draft.nom.trim()) return
    onChange({ ingredientId: null, suggested: false, create: { ...draft, nom: draft.nom.trim() } })
    setMode('closed')
  }

  return (
    <div className="ing-pick">
      <div className="ing-pick-head">
        <span className="ing-pick-name">
          {chosen ? <><strong>{chosen.nom}</strong>{row.suggested && <span className="tag">suggestion</span>}</>
            : row.create ? <><strong>{row.create.nom}</strong><span className="tag">à créer</span></>
            : <span className="ing-none">Aucun ingrédient choisi</span>}
        </span>
        <button type="button" className="btn btn-secondary ing-btn" onClick={() => setMode(mode === 'list' ? 'closed' : 'list')}
          aria-expanded={mode === 'list'}>
          {chosen || row.create ? 'Changer' : 'Choisir'}
        </button>
        <button type="button" className="btn btn-secondary ing-btn" onClick={() => (mode === 'create' ? setMode('closed') : openCreate())}
          aria-expanded={mode === 'create'}>Créer</button>
      </div>
      {mode === 'list' && (
        <IngredientList catalog={catalog} extra={pending} initialQuery={tokens(row.nom)[0] ?? ''}
          onPick={(i) => {
            // Un ingrédient « nouveau » (sans id) reprend ses réglages de création.
            onChange(i.id ? { ingredientId: i.id, suggested: false, create: null } : { ingredientId: null, suggested: false, create: i })
            setMode('closed')
          }} />
      )}
      {mode === 'create' && draft && (
        <div className="picker create-box">
          <label>Nom de l'ingrédient (générique, au singulier)
            <input className="field" value={draft.nom} onChange={(e) => setDraft({ ...draft, nom: e.target.value })} />
          </label>
          <div className="row">
            <label>Rayon
              <RayonInput value={draft.rayon} onChange={(rayon) => setDraft({ ...draft, rayon })} catalog={catalog} placeholder="Ex. épicerie" />
            </label>
            <label>Unité de stock
              <select className="field" value={draft.unite} onChange={(e) => setDraft({ ...draft, unite: e.target.value })}>
                {STOCK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>
          <label className="switch">
            <input type="checkbox" role="switch" checked={draft.basique} onChange={(e) => setDraft({ ...draft, basique: e.target.checked })} />
            <span className="switch-track" aria-hidden="true" />
            Basique (sel, huile… jamais compté comme manquant)
          </label>
          <div className="ing-actions">
            <button type="button" className="btn btn-primary" disabled={!draft.nom.trim()} onClick={confirmCreate}>Créer</button>
            <button type="button" className="btn btn-secondary" onClick={() => setMode('closed')}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
