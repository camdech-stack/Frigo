import { useEffect, useMemo, useRef, useState } from 'react'
import { useInventory } from '../lib/InventoryContext'
import { setUpdateBusy } from '../lib/updateGate'
import { originalLines, parseIngredientLines } from '../lib/ingredientParser'
import { matchIngredient } from '../lib/matchIngredient'
import { RECIPE_UNITS } from '../lib/options'
import { allTags, parseTags, safeUrl } from '../lib/recipes'
import IngredientPicker from './IngredientPicker'

let rowKey = 0
const newRow = (patch = {}) => ({ key: ++rowKey, nom: '', quantite: '', unite: '', ingredientId: null, suggested: false, create: null, ...patch })

const fmt = (n) => (n === null || n === undefined ? '' : String(n).replace('.', ','))

// Formulaire d'ajout / de modification d'une recette. Les lignes collées sont découpées par
// des règles de code (ingredientParser.js), rapprochées du catalogue, puis corrigées à la main.
export default function RecipeForm({ recipe, onDone }) {
  const { ingredients, recipes, linesByRecipe, ingredientsById, saveRecipe } = useInventory()
  const editing = Boolean(recipe)

  const [titre, setTitre] = useState(recipe?.titre ?? '')
  const [url, setUrl] = useState(recipe?.url ?? '')
  const [portions, setPortions] = useState(String(recipe?.portions ?? 4))
  const [temps, setTemps] = useState(recipe?.temps_min == null ? '' : String(recipe.temps_min))
  const [tags, setTags] = useState((recipe?.tags ?? []).join(', '))
  const [text, setText] = useState((recipe?.ingredients ?? []).join('\n'))
  const [rows, setRows] = useState(() =>
    (recipe ? linesByRecipe.get(recipe.id) ?? [] : []).map((l) => newRow({
      nom: ingredientsById.get(l.ingredient_id)?.nom ?? '', quantite: fmt(l.quantite), unite: l.unite ?? '', ingredientId: l.ingredient_id,
    })))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const topRef = useRef(null)

  // Une saisie est ouverte : pas de rechargement pour mise à jour de l'app.
  useEffect(() => { setUpdateBusy(true, 'recipe-form'); return () => setUpdateBusy(false, 'recipe-form') }, [])
  useEffect(() => { topRef.current?.scrollIntoView?.({ block: 'start' }) }, [])

  const tagList = useMemo(() => allTags(recipes), [recipes])
  const selectedTags = parseTags(tags)
  const toggleTag = (t) => setTags((selectedTags.includes(t) ? selectedTags.filter((x) => x !== t) : [...selectedTags, t]).join(', '))
  // Ingrédients « à créer » déjà prévus dans le tableau : réutilisables sur une autre ligne.
  const pending = useMemo(() => {
    const seen = new Map()
    rows.forEach((r) => { if (r.create && !seen.has(r.create.nom.toLowerCase())) seen.set(r.create.nom.toLowerCase(), r.create) })
    return [...seen.values()]
  }, [rows])

  function split() {
    if (rows.length && !window.confirm('Le tableau actuel sera remplacé par le découpage des lignes. Continuer ?')) return
    setError('')
    setRows(parseIngredientLines(text).map((p) => {
      const match = matchIngredient(p.nom, ingredients)
      return newRow({ nom: p.nom, quantite: fmt(p.quantite), unite: p.unite ?? '', ingredientId: match?.ingredient.id ?? null, suggested: Boolean(match) })
    }))
  }

  const patchRow = (key, patch) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  async function submit(e) {
    e.preventDefault()
    const fail = (m) => { setError(m); topRef.current?.scrollIntoView?.({ block: 'start' }) }
    if (!titre.trim()) return fail('Le titre est obligatoire.')
    const link = url.trim() ? safeUrl(url) : null
    if (url.trim() && !link) return fail('Lien refusé : seuls les liens http et https sont acceptés.')
    const nPortions = Number(portions)
    if (!Number.isInteger(nPortions) || nPortions < 1) return fail('Le nombre de portions doit être un entier supérieur à 0.')
    const nTemps = temps.trim() === '' ? null : Number(temps)
    if (nTemps !== null && (!Number.isInteger(nTemps) || nTemps < 0)) return fail('Le temps doit être un nombre entier de minutes.')
    if (!rows.length) return fail(text.trim() ? 'Clique sur « Découper les lignes » pour préparer le tableau des ingrédients.' : 'Ajoute au moins un ingrédient.')

    const lines = []
    for (const [i, r] of rows.entries()) {
      if (!r.ingredientId && !r.create) return fail(`Ligne ${i + 1} : choisis ou crée l'ingrédient${r.nom ? ` (« ${r.nom} »)` : ''}, ou supprime la ligne.`)
      const q = r.quantite.trim() === '' ? null : Number(r.quantite.replace(',', '.'))
      if (q !== null && !(q >= 0)) return fail(`Ligne ${i + 1} : quantité invalide.`)
      lines.push({ ingredientId: r.ingredientId, create: r.create, quantite: q, unite: r.unite })
    }

    setSaving(true)
    setError('')
    const message = await saveRecipe({
      id: recipe?.id ?? null,
      fields: { titre: titre.trim(), url: link, portions: nPortions, temps_min: nTemps, tags: parseTags(tags), ingredients: originalLines(text) },
      rows: lines,
    })
    setSaving(false)
    if (message) return fail(message) // on garde la saisie pour réessayer
    onDone()
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <div ref={topRef} />
      <h2>{editing ? 'Modifier la recette' : 'Ajouter une recette'}</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <label>Titre
        <input className="field" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Gratin de courgettes" />
      </label>
      <label>Lien de la recette
        <input className="field" type="text" inputMode="url" autoCapitalize="none" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… (facultatif)" />
      </label>
      <div className="row">
        <label>Portions
          <input className="field" type="number" inputMode="numeric" min="1" step="1" value={portions} onChange={(e) => setPortions(e.target.value)} />
        </label>
        <label>Temps (minutes)
          <input className="field" type="number" inputMode="numeric" min="0" step="1" value={temps} onChange={(e) => setTemps(e.target.value)}
            placeholder="Facultatif" />
        </label>
      </div>
      <label>Étiquettes (séparées par des virgules)
        <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex. rapide, végétarien" />
      </label>
      {tagList.length > 0 && (
        <div className="filters tag-choices" role="group" aria-label="Étiquettes existantes">
          {tagList.map((t) => (
            <button key={t} type="button" className={'chip' + (selectedTags.includes(t) ? ' active' : '')} aria-pressed={selectedTags.includes(t)}
              onClick={() => toggleTag(t)}>{t}</button>
          ))}
        </div>
      )}

      <label>Ingrédients : colle les lignes telles qu'elles sont sur le site
        <textarea className="field area" rows={8} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={'200 g de crème fraîche épaisse\n2 gousses d\'ail\nSel et poivre'} />
      </label>
      <button type="button" className="btn btn-secondary" onClick={split} disabled={!text.trim()}>
        {rows.length ? 'Découper à nouveau (remplace le tableau)' : 'Découper les lignes'}
      </button>

      {rows.length > 0 && (
        <>
          <p className="hint">Vérifie chaque ligne : quantité, unité et ingrédient du catalogue. « à votre goût » = quantité vide.</p>
          <ul className="ing-rows">
            {rows.map((r, i) => (
              <li key={r.key} className="ing-row">
                <p className="ing-num">Ligne {i + 1}{r.nom && <span className="ing-from"> · {r.nom}</span>}</p>
                <div className="row">
                  <label>Quantité
                    <input className="field" inputMode="decimal" value={r.quantite} placeholder="vide"
                      onChange={(e) => patchRow(r.key, { quantite: e.target.value })} />
                  </label>
                  <label>Unité
                    <select className="field" value={r.unite} onChange={(e) => patchRow(r.key, { unite: e.target.value })}>
                      <option value="">—</option>
                      {RECIPE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </label>
                </div>
                <IngredientPicker row={r} catalog={ingredients} pending={pending} onChange={(patch) => patchRow(r.key, patch)} />
                <button type="button" className="btn btn-text" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>Supprimer la ligne</button>
              </li>
            ))}
          </ul>
        </>
      )}
      <button type="button" className="btn btn-secondary" onClick={() => setRows((rs) => [...rs, newRow()])}>+ Ajouter une ligne</button>

      <div className="actions-bar">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        <button type="button" className="btn btn-secondary" onClick={onDone} disabled={saving}>Annuler</button>
      </div>
    </form>
  )
}
