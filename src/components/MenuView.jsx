import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInventory } from '../lib/InventoryContext'
import { todayIso } from '../lib/expiry'
import {
  PERSONNES_DEFAUT, REPAS_DEFAUT, REPAS_MAX, REPAS_MIN, cuisinerReste, evaluerSelection, libelleManque,
  planifier, produitsNonAssocies, produitsNonUtilises, toRecette,
} from '../lib/menu'
import ExpiryBadge from './ExpiryBadge'
import CookSheet from './CookSheet'
import MenuRow from './MenuRow'

// Ligne à enregistrer pour une recette calculée : la « photo » du moment (produits, manquants, phrase).
const toRow = (c) => ({
  recipe_id: c.recette.id, personnes: c.personnes,
  utilise: c.utilise.map((u) => u.item_id), manque: c.manque.map(libelleManque), note: c.pourquoi,
})

// Onglet Menu : deux boutons (reste / planifier), menu enregistré partagé entre appareils,
// produits qui périment sans être utilisés. Tout est calculé ici, sans IA (src/lib/menu.js).
export default function MenuView() {
  const {
    items, loading, recipes, linesByRecipe, ingredientsById, recipesLoading,
    menuEntries, menuLoading, menuError, reloadMenu,
    replaceMenuEntries, addMenuEntry, patchMenuEntry, removeMenuEntry, cookEntry,
  } = useInventory()
  const navigate = useNavigate()
  const [personnes, setPersonnes] = useState(PERSONNES_DEFAUT)
  const [repas, setRepas] = useState(REPAS_DEFAUT)
  const [reste, setReste] = useState(false) // propositions « reste » affichées (recalculées à chaque changement du stock)
  const [pending, setPending] = useState(null) // nouveau menu en attente de confirmation de remplacement
  const [busy, setBusy] = useState(false)
  const [cookingId, setCookingId] = useState(null) // entrée du menu dont l'écran « J'ai cuisiné » est ouvert
  const [error, setError] = useState('')
  const today = todayIso()

  const stock = useMemo(() => items.filter((i) => i.status === 'in_stock'), [items])
  // Recettes utilisables : au moins un ingrédient non basique.
  const recettes = useMemo(
    () => recipes
      .map((r) => toRecette(r, linesByRecipe.get(r.id) ?? [], ingredientsById))
      .filter((r) => r.lignes.some((l) => !l.basique)),
    [recipes, linesByRecipe, ingredientsById],
  )
  const parId = useMemo(() => new Map(recettes.map((r) => [r.id, r])), [recettes])

  // Menu enregistré, recalculé avec le stock actuel (une entrée dont la recette a disparu est ignorée).
  const lignesMenu = useMemo(() => menuEntries.filter((e) => parId.has(e.recipe_id)), [menuEntries, parId])
  const calcule = useMemo(
    () => evaluerSelection(lignesMenu.map((e) => ({ recette: parId.get(e.recipe_id), personnes: e.personnes })), stock, { today }),
    [lignesMenu, parId, stock, today],
  )
  const propositions = useMemo(
    () => (reste ? cuisinerReste(recettes, stock, { personnes, today }) : []),
    [reste, recettes, stock, personnes, today],
  )
  const nonUtilises = useMemo(() => produitsNonUtilises(stock, calcule.map((c) => c.recette), { today }), [stock, calcule, today])
  const nonAssocies = useMemo(() => produitsNonAssocies(stock), [stock])
  const dansMenu = new Set(lignesMenu.map((e) => e.recipe_id))
  const aAjouter = useMemo(() => recettes.filter((r) => !dansMenu.has(r.id)).sort((a, b) => a.titre.localeCompare(b.titre, 'fr')),
    [recettes, menuEntries]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || recipesLoading || menuLoading) return <p className="empty">Chargement…</p>
  if (menuError) {
    return (
      <div className="panel">
        <p className="error" role="alert">{menuError}</p>
        <button className="btn btn-primary" onClick={() => reloadMenu()}>Réessayer</button>
      </div>
    )
  }

  async function run(action) {
    setBusy(true)
    setError('')
    const message = await action()
    setBusy(false)
    if (message) setError(message)
  }

  function planifierSemaine() {
    setReste(false)
    const choisis = planifier(recettes, stock, { personnes, repas, today })
    if (!choisis.length) return setError('Aucune recette utilisable : ajoute des recettes dans la bibliothèque.')
    const rows = choisis.map(toRow)
    setError('')
    if (menuEntries.length) setPending(rows) // un menu existe : on demande confirmation avant de le remplacer
    else run(() => replaceMenuEntries(rows))
  }

  const confirmReplace = () => run(async () => {
    const message = await replaceMenuEntries(pending)
    if (!message) setPending(null)
    return message
  })

  // Recalcule la « photo » d'une entrée après un changement de personnes.
  const changePersonnes = (entry, n) => {
    const i = lignesMenu.findIndex((e) => e.id === entry.id)
    const c = evaluerSelection(
      lignesMenu.map((e) => ({ recette: parId.get(e.recipe_id), personnes: e.id === entry.id ? n : e.personnes })), stock, { today },
    )[i]
    return run(() => patchMenuEntry(entry.id, { personnes: n, utilise: c.utilise.map((u) => u.item_id), manque: c.manque.map(libelleManque), note: c.pourquoi }))
  }

  // Ajoute une recette en fin de menu (depuis une proposition « reste » ou depuis la bibliothèque).
  const ajouter = (recette, n) => {
    const selection = [...lignesMenu.map((e) => ({ recette: parId.get(e.recipe_id), personnes: e.personnes })), { recette, personnes: n }]
    const c = evaluerSelection(selection, stock, { today }).at(-1)
    return run(() => addMenuEntry(toRow(c)))
  }

  const cooking = cookingId && lignesMenu.find((e) => e.id === cookingId) // disparaît seule une fois cuisinée
  const nbProduits = nonAssocies.length
  return (
    <>
      <h2 className="sr-only">Menu</h2>
      {nbProduits > 0 && (
        <Link to="/associer" className="btn btn-secondary link-banner">
          {nbProduits} produit{nbProduits > 1 ? 's' : ''} non associé{nbProduits > 1 ? 's' : ''} : associer pour mieux composer le menu
        </Link>
      )}

      <section className="panel menu-controls" aria-label="Composer un menu">
        <div className="row">
          <div>
            <label htmlFor="menu-personnes">Personnes</label>
            <input id="menu-personnes" className="field" type="number" inputMode="numeric" min="1" max="12" value={personnes}
              onChange={(e) => setPersonnes(Math.min(12, Math.max(1, Math.round(Number(e.target.value)) || 1)))} />
          </div>
          <div>
            <label htmlFor="menu-repas">Nombre de repas</label>
            <select id="menu-repas" className="field" value={repas} onChange={(e) => setRepas(Number(e.target.value))}>
              {Array.from({ length: REPAS_MAX - REPAS_MIN + 1 }, (_, i) => REPAS_MIN + i).map((n) => <option key={n} value={n}>{n} repas</option>)}
            </select>
          </div>
        </div>
        <button type="button" className={'btn ' + (reste ? 'btn-ink' : 'btn-secondary')} aria-pressed={reste} onClick={() => setReste(!reste)}>
          Cuisiner avec ce qu'il reste
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={planifierSemaine}>Planifier la semaine</button>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {pending && (
        <div className="panel" role="alertdialog" aria-label="Remplacer le menu">
          <p><strong>Remplacer le menu actuel ({menuEntries.length} repas) par ce nouveau menu de {pending.length} repas ?</strong></p>
          <div className="recipe-actions">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={confirmReplace}>{busy ? 'Enregistrement…' : 'Oui, remplacer'}</button>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setPending(null)}>Annuler</button>
          </div>
        </div>
      )}

      {reste && (
        <section aria-label="Avec ce qu'il reste">
          <h3 className="section-head"><span>Avec ce qu'il reste</span><span className="section-count">{propositions.length}</span><span className="section-rule" aria-hidden="true" /></h3>
          {propositions.length === 0 ? (
            <p className="empty">Aucune recette faisable avec 2 manquants au plus. Ajoute des recettes ou associe tes produits.</p>
          ) : (
            <ul className="menu-list">
              {propositions.map((c) => (
                <MenuRow key={c.recette.id} result={c} busy={busy || dansMenu.has(c.recette.id)} onAdd={() => ajouter(c.recette, personnes)} />
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-label="Menu enregistré">
        <h3 className="section-head"><span>Mon menu</span><span className="section-count">{calcule.length}</span><span className="section-rule" aria-hidden="true" /></h3>
        {calcule.length === 0 ? (
          <p className="empty">Pas de menu pour l'instant. Choisis « Planifier la semaine » ou ajoute une recette ci-dessous.</p>
        ) : (
          <ul className="menu-list">
            {calcule.map((c, i) => (
              <MenuRow key={lignesMenu[i].id} result={c} busy={busy}
                onPersonnes={(n) => changePersonnes(lignesMenu[i], n)}
                onCook={() => setCookingId(lignesMenu[i].id)}
                onRemove={() => run(() => removeMenuEntry(lignesMenu[i].id))} />
            ))}
          </ul>
        )}
        <div className="panel menu-add">
          <label htmlFor="menu-add">Ajouter une recette de la bibliothèque</label>
          <select id="menu-add" className="field" value="" disabled={busy || aAjouter.length === 0}
            onChange={(e) => { const r = parId.get(e.target.value); if (r) ajouter(r, personnes) }}>
            <option value="">{aAjouter.length ? 'Choisir une recette…' : 'Aucune recette à ajouter'}</option>
            {aAjouter.map((r) => <option key={r.id} value={r.id}>{r.titre}</option>)}
          </select>
        </div>
      </section>

      {calcule.length > 0 && (
        <section className="panel" aria-label="Pas utilisé par ce menu">
          <h3 className="recipe-title">Pas utilisé par ce menu</h3>
          {nonUtilises.length === 0 ? (
            <p className="hint">Tous tes produits rouges et orange sont dans le menu.</p>
          ) : (
            <ul className="menu-unused">
              {nonUtilises.map(({ item, jours }) => (
                <li key={item.id} className="menu-unused-row">
                  <ExpiryBadge days={jours} />
                  <span className="row-main"><strong className="row-name">{item.name}</strong></span>
                  <button type="button" className="btn btn-secondary"
                    onClick={() => navigate(`/recettes?ingredient=${item.ingredient_id}`)}>Recettes avec cet ingrédient</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {cooking && (
        <CookSheet entry={cooking} recette={parId.get(cooking.recipe_id)} stock={stock}
          onConfirm={(changes) => cookEntry(cooking, changes)} onClose={() => setCookingId(null)} />
      )}
    </>
  )
}
