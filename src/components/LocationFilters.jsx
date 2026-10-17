import { LOCATIONS } from '../lib/options'

// Puces de filtre d'emplacement (DESIGN.md §6.1) : Tous, Frigo, Congélo, Placard.
// Affichées en rangée sur téléphone / tablette portrait, en liste verticale dans le rail (iPad paysage).
export default function LocationFilters({ filter, onFilter, className = '' }) {
  return (
    <div className={'filters ' + className} role="group" aria-label="Filtrer par emplacement">
      {[{ value: 'all', label: 'Tous' }, ...LOCATIONS].map((f) => (
        <button key={f.value} type="button" className={'chip' + (filter === f.value ? ' active' : '')}
          aria-pressed={filter === f.value} onClick={() => onFilter(f.value)}>
          {f.label}
        </button>
      ))}
    </div>
  )
}
