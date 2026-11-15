import { libelleManque } from '../lib/menu'
import { formatTime, safeUrl } from '../lib/recipes'
import ExpiryBadge from './ExpiryBadge'

// Une recette du menu : titre + lien source, temps, produits utilisés (pastille verte + pastille de péremption),
// manquants avec quantité, phrase « pourquoi ». Les actions dépendent du contexte :
//  - menu enregistré : nombre de personnes modifiable + « J'ai cuisiné » + « Retirer » ;
//  - proposition du mode reste : « Ajouter au menu ».
export default function MenuRow({ result, onPersonnes, onRemove, onAdd, onCook, busy = false }) {
  const { recette, personnes, utilise, manque, pourquoi } = result
  const link = safeUrl(recette.url) // jamais de lien javascript: rendu cliquable
  const time = formatTime(recette.temps_min)
  return (
    <li className="menu-row">
      <h3 className="recipe-title">{recette.titre}</h3>
      <p className="recipe-meta">
        {link ? <a href={link} target="_blank" rel="noopener noreferrer">{recette.source || 'Source'} ↗</a>
          : recette.source && <span>{recette.source}</span>}
        {time && <span>{time}</span>}
      </p>
      <p className="menu-why">{pourquoi}</p>
      {utilise.length > 0 && (
        <ul className="menu-pills" aria-label="Produits utilisés">
          {utilise.map((u) => (
            <li key={u.item_id} className="menu-pill used">
              <span>{u.nom}</span>
              <ExpiryBadge days={u.jours} />
            </li>
          ))}
        </ul>
      )}
      {manque.length > 0 ? (
        <ul className="menu-pills" aria-label="Ingrédients manquants">
          {manque.map((m) => <li key={m.ingredient_id + m.etat} className="menu-pill missing">À acheter : {libelleManque(m)}</li>)}
        </ul>
      ) : (
        <p className="hint">Rien à acheter.</p>
      )}
      <div className="menu-actions">
        {onPersonnes && (
          <div className="stepper" role="group" aria-label={`Personnes pour ${recette.titre}`}>
            <button type="button" className="step-btn" aria-label="Moins de personnes" disabled={personnes <= 1}
              onClick={() => onPersonnes(personnes - 1)}>−</button>
            <span className="stepper-value" aria-live="polite">{personnes} pers.</span>
            <button type="button" className="step-btn" aria-label="Plus de personnes" disabled={personnes >= 12}
              onClick={() => onPersonnes(personnes + 1)}>+</button>
          </div>
        )}
        {onCook && <button type="button" className="btn btn-ink" disabled={busy} onClick={onCook}>J'ai cuisiné</button>}
        {onRemove && <button type="button" className="btn btn-secondary" disabled={busy} onClick={onRemove}>Retirer</button>}
        {onAdd && <button type="button" className="btn btn-primary" disabled={busy} onClick={onAdd}>Ajouter au menu</button>}
      </div>
    </li>
  )
}
