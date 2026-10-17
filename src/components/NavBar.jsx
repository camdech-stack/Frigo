import { NavLink } from 'react-router-dom'

// Une entrée par vue de premier niveau : deux onglets pour l'instant (Aperçu, Inventaire).
// Ajouter est un panneau (CTA « + » / « Scanner »), Réglages s'ouvre par l'engrenage de l'en-tête.
// Future vue (ex. Recettes) : ajouter une ligne ici et une <Route> dans Shell.jsx.
export const NAV_ITEMS = [
  { to: '/', label: 'Aperçu', end: true },
  { to: '/inventaire', label: 'Inventaire' },
]

// Onglets en forme de puces (même rendu que les filtres). Affichés sous l'en-tête, ou dans le rail iPad.
export default function NavBar({ className = '' }) {
  return (
    <nav className={'tabs ' + className} aria-label="Navigation principale">
      {NAV_ITEMS.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'chip' + (isActive ? ' active' : '')}>
          {n.label}
        </NavLink>
      ))}
    </nav>
  )
}
