import { useMemo, useState } from 'react'
import { useInventory } from '../lib/InventoryContext'
import { allTags, filterRecipes } from '../lib/recipes'
import IngredientList from './IngredientList'
import RecipeCard from './RecipeCard'
import RecipeForm from './RecipeForm'

// Onglet Recettes : recherche (titre ou ingrédient), filtres par étiquette, filtre « contient l'ingrédient »,
// cartes, et formulaire d'ajout / modification (qui remplace la liste le temps de la saisie).
export default function RecipesView() {
  const { recipes, linesByRecipe, ingredients, ingredientsById, recipesLoading, recipesError, reloadRecipes, removeRecipe } = useInventory()
  const [query, setQuery] = useState('')
  const [tags, setTags] = useState([])
  const [ingredientId, setIngredientId] = useState(null)
  const [pickingIngredient, setPickingIngredient] = useState(false)
  const [form, setForm] = useState(null) // null = liste ; { recipe } = formulaire (recipe null = ajout)

  const tagList = useMemo(() => allTags(recipes), [recipes])
  const shown = useMemo(
    () => filterRecipes(recipes, { query, tags, ingredientId }, linesByRecipe, ingredientsById),
    [recipes, query, tags, ingredientId, linesByRecipe, ingredientsById],
  )
  const filtered = Boolean(query.trim() || tags.length || ingredientId)

  if (form) return <RecipeForm recipe={form.recipe} onDone={() => setForm(null)} />
  if (recipesLoading) return <p className="empty">Chargement…</p>
  if (recipesError) {
    return (
      <div className="panel">
        <p className="error" role="alert">{recipesError}</p>
        <button className="btn btn-primary" onClick={reloadRecipes}>Réessayer</button>
      </div>
    )
  }

  const toggleTag = (t) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
  const chosen = ingredientsById.get(ingredientId)

  return (
    <>
      <h2 className="sr-only">Recettes</h2>
      <div className="recipes-head">
        <button type="button" className="btn btn-primary" onClick={() => setForm({ recipe: null })}>+ Ajouter une recette</button>
      </div>

      <section className="panel recipe-filters" aria-label="Recherche et filtres">
        <input className="field" type="search" aria-label="Rechercher une recette ou un ingrédient" placeholder="Rechercher (titre ou ingrédient)"
          value={query} onChange={(e) => setQuery(e.target.value)} />
        {tagList.length > 0 && (
          <div className="filters" role="group" aria-label="Étiquettes">
            {tagList.map((t) => (
              <button key={t} type="button" className={'chip' + (tags.includes(t) ? ' active' : '')} aria-pressed={tags.includes(t)}
                onClick={() => toggleTag(t)}>{t}</button>
            ))}
          </div>
        )}
        <div className="ing-filter">
          <button type="button" className={'chip' + (chosen || pickingIngredient ? ' active' : '')} aria-expanded={pickingIngredient}
            onClick={() => (chosen ? setIngredientId(null) : setPickingIngredient(!pickingIngredient))}>
            {chosen ? `Contient : ${chosen.nom} ✕` : 'Contient l\'ingrédient…'}
          </button>
        </div>
        {pickingIngredient && !chosen && (
          <IngredientList catalog={ingredients} label="Choisir un ingrédient du catalogue"
            onPick={(i) => { setIngredientId(i.id); setPickingIngredient(false) }} />
        )}
      </section>

      <p className="hint recipes-count" role="status">
        {shown.length} recette{shown.length > 1 ? 's' : ''}{filtered ? ` sur ${recipes.length}` : ''}
      </p>
      {shown.length === 0 ? (
        <p className="empty">{recipes.length === 0 ? 'Aucune recette pour l\'instant. Ajoute la première avec le bouton ci-dessus.' : 'Aucune recette ne correspond.'}</p>
      ) : (
        <ul className="recipes">
          {shown.map((r) => <RecipeCard key={r.id} recipe={r} onEdit={(recipe) => setForm({ recipe })} onDelete={removeRecipe} />)}
        </ul>
      )}
    </>
  )
}
