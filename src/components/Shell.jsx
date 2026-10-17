import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useInventory } from '../lib/InventoryContext'
import { formatDateFr, todayIso } from '../lib/expiry'
import AddButtons from './AddButtons'
import AddView from './AddView'
import ConnectionDot from './ConnectionDot'
import CookingBar from './CookingBar'
import ItemsView from './ItemsView'
import LocationFilters from './LocationFilters'
import NavBar from './NavBar'
import OfflineBanner from './OfflineBanner'
import OverviewView from './OverviewView'
import SettingsView from './SettingsView'
import Toast from './Toast'

// Cadre commun à toutes les vues : en-tête (titre, indicateur de connexion, réglages), onglets,
// erreurs et toasts globaux. Vit dans le routeur mais sous le provider : changer de vue
// ne touche ni à la liste, ni au canal temps réel.
// Téléphone / tablette portrait (< 1024 px) : barre d'actions en bas. iPad paysage (≥ 1024 px) : rail à gauche.
export default function Shell() {
  const { actionError, connection, toast, setToast, items } = useInventory()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // filtre d'emplacement de l'Inventaire (puces ou rail)
  const adding = pathname === '/ajouter'

  // Fermer le panneau Ajouter ramène sur la dernière vue de liste ouverte.
  const lastList = useRef('/')
  useEffect(() => { if (!adding) lastList.current = pathname }, [adding, pathname])
  const closeAdd = useCallback(() => navigate(lastList.current), [navigate])

  const count = `${items.length} produit${items.length > 1 ? 's' : ''}`
  return (
    <div className="app">
      <aside className="rail" aria-label="Rail latéral">
        <div className="rail-title" aria-hidden="true">Mon frigo</div>
        <p className="rail-sub">{formatDateFr(todayIso())} · {count}</p>
        <NavBar className="tabs-rail" />
        {pathname === '/inventaire' && (
          <>
            <p className="label-caps">Emplacement</p>
            <LocationFilters filter={filter} onFilter={setFilter} />
          </>
        )}
        <div className="rail-spacer" />
        <AddButtons variant="rail" />
      </aside>

      <main className="page">
        <header className="top">
          <h1>Mon frigo</h1>
          <div className="top-meta">
            <span className="top-count">{count}</span>
            <ConnectionDot state={connection} />
          </div>
          <Link to="/reglages" className="icon-btn" aria-label="Réglages">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M4 7h16M4 17h16" /><rect x="7" y="4.5" width="5" height="5" rx="1.5" fill="var(--color-surface)" />
              <rect x="12" y="14.5" width="5" height="5" rx="1.5" fill="var(--color-surface)" />
            </svg>
          </Link>
        </header>
        <NavBar className="tabs-top" />
        <OfflineBanner />
        <CookingBar />
        {actionError && <p className="error" role="alert">{actionError}</p>}
        <Routes>
          <Route path="/" element={<OverviewView />} />
          <Route path="/inventaire" element={<ItemsView filter={filter} onFilter={setFilter} />} />
          {/* Ajouter reste monté hors des Routes (voir AddView) ; ici seulement l'URL est déclarée. */}
          <Route path="/ajouter" element={null} />
          <Route path="/reglages" element={<SettingsView />} />
          {/* Futures vues (recettes…) : ajouter une <Route> ici et une entrée dans NavBar. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <div className="bottom-bar">
        <AddButtons variant="bar" />
      </div>

      <AddView active={adding} onClose={closeAdd} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
