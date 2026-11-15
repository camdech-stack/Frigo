import { useMemo } from 'react'
import { suggestIngredient } from '../lib/matchIngredient'
import IngredientPicker from './IngredientPicker'

// Champ « Ingrédient » d'un produit : l'ingrédient du catalogue auquel il se rattache.
//  - value : { ingredientId, create } (create = ingrédient à créer à la validation) ;
//  - si rien n'est choisi, la meilleure correspondance avec le nom est proposée : un tap pour confirmer ;
//  - sinon « Choisir » dans le catalogue ou « Créer » (le choix est mémorisé par code-barres à l'ajout).
export default function ItemIngredient({ name, brand, value, onChange, catalog }) {
  const chosen = Boolean(value.ingredientId || value.create)
  const suggestion = useMemo(
    () => (chosen ? null : suggestIngredient(name, catalog, { brand })?.ingredient ?? null),
    [chosen, name, brand, catalog],
  )
  return (
    <div className="field-group ing-field">
      <span className="field-label">Ingrédient</span>
      {suggestion && (
        <div className="ing-suggest">
          <span>Suggestion : <strong>{suggestion.nom}</strong></span>
          <button type="button" className="btn btn-primary ing-btn"
            onClick={() => onChange({ ingredientId: suggestion.id, create: null })}>Confirmer</button>
        </div>
      )}
      <IngredientPicker row={{ nom: name, ingredientId: value.ingredientId, suggested: false, create: value.create }}
        catalog={catalog} pending={[]}
        onChange={(p) => onChange({ ingredientId: p.ingredientId ?? null, create: p.create ?? null })} />
    </div>
  )
}
