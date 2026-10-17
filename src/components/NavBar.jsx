import { NavLink } from 'react-router-dom'

// Icônes SVG simples (contour), héritent la couleur du texte.
const icon = (children) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
)

// Une entrée par vue. Pour une future vue (ex. Recettes), ajouter une ligne ici
// et une <Route> dans App.jsx.
export const NAV_ITEMS = [
  { to: '/', label: 'Aperçu', end: true,
    icon: icon(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>) },
  { to: '/inventaire', label: 'Inventaire',
    icon: icon(<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></>) },
  { to: '/ajouter', label: 'Ajouter',
    icon: icon(<><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>) },
  { to: '/reglages', label: 'Réglages',
    icon: icon(<><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="17" x2="20" y2="17" /><circle cx="9" cy="7" r="2.5" fill="var(--nav-bg)" /><circle cx="15" cy="17" r="2.5" fill="var(--nav-bg)" /></>) },
]

// Barre du bas (< 768 px) ou barre latérale (≥ 768 px) : seul le CSS change.
export default function NavBar() {
  return (
    <nav className="nav" aria-label="Navigation principale">
      {NAV_ITEMS.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          {n.icon}<span>{n.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
