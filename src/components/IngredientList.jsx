import { useMemo, useState } from 'react'
import { searchByName } from '../lib/matchIngredient'

const MAX = 60 // au-delà, on invite à préciser la recherche

// Liste du catalogue avec champ de recherche. `onPick(ingredient)` au choix.
// `extra` : ingrédients à ajouter en fin de liste (ex. « nouveaux » déjà prévus dans la recette).
export default function IngredientList({ catalog, extra = [], onPick, initialQuery = '', label = 'Rechercher dans le catalogue' }) {
  const [q, setQ] = useState(initialQuery)
  const list = useMemo(() => [...catalog, ...extra], [catalog, extra])
  const found = useMemo(() => searchByName(q, list), [q, list])
  return (
    <div className="picker">
      <input className="field" type="search" autoFocus aria-label={label} placeholder={label} value={q}
        onChange={(e) => setQ(e.target.value)} />
      <ul className="pick-list">
        {found.slice(0, MAX).map((i) => (
          <li key={i.id ?? 'new-' + i.nom}>
            <button type="button" className="pick-item" onClick={() => onPick(i)}>
              <span>{i.nom}</span>
              <span className="pick-sub">{i.id ? i.rayon : 'nouveau'}</span>
            </button>
          </li>
        ))}
        {found.length === 0 && <li className="pick-empty">Aucun ingrédient ne correspond.</li>}
        {found.length > MAX && <li className="pick-empty">{found.length - MAX} autres : précise la recherche.</li>}
      </ul>
    </div>
  )
}
