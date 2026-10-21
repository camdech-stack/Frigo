import { useState } from 'react'
import { formatTime, safeUrl } from '../lib/recipes'

// Carte d'une recette : titre, source (lien http/https seulement), temps, portions, étiquettes,
// lignes d'origine dépliables, modification et suppression avec confirmation.
export default function RecipeCard({ recipe, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const link = safeUrl(recipe.url) // un lien invalide en base (ex. javascript:) n'est jamais rendu cliquable
  const time = formatTime(recipe.temps_min)

  async function confirmDelete() {
    setBusy(true)
    setError('')
    const message = await onDelete(recipe)
    setBusy(false)
    if (message) setError(message)
  }

  return (
    <li className="recipe-card">
      <h3 className="recipe-title">{recipe.titre}</h3>
      <p className="recipe-meta">
        {link ? <a href={link} target="_blank" rel="noopener noreferrer">{recipe.source || 'Source'} ↗</a>
          : recipe.source && <span>{recipe.source}</span>}
        {time && <span>{time}</span>}
        <span>{recipe.portions} portion{recipe.portions > 1 ? 's' : ''}</span>
      </p>
      {recipe.tags?.length > 0 && (
        <p className="recipe-tags">{recipe.tags.map((t) => <span key={t} className="tag">{t}</span>)}</p>
      )}
      <details className="recipe-ing">
        <summary>Ingrédients ({recipe.ingredients?.length ?? 0})</summary>
        <ul>{(recipe.ingredients ?? []).map((l, i) => <li key={i}>{l}</li>)}</ul>
      </details>
      {error && <p className="error" role="alert">{error}</p>}
      {confirming ? (
        <div className="recipe-actions" role="group" aria-label="Confirmer la suppression">
          <p className="recipe-confirm">Supprimer « {recipe.titre} » ?</p>
          <button type="button" className="btn btn-ink" onClick={confirmDelete} disabled={busy}>{busy ? 'Suppression…' : 'Oui, supprimer'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)} disabled={busy}>Annuler</button>
        </div>
      ) : (
        <div className="recipe-actions">
          <button type="button" className="btn btn-secondary" onClick={() => onEdit(recipe)}>Modifier</button>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>Supprimer</button>
        </div>
      )}
    </li>
  )
}
