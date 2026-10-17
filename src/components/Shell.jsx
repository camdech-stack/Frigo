import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useInventory } from '../lib/InventoryContext'
import AddView from './AddView'
import ConnectionDot from './ConnectionDot'
import CookingBar from './CookingBar'
import ItemsView from './ItemsView'
import NavBar from './NavBar'
import OfflineBanner from './OfflineBanner'
import OverviewView from './OverviewView'
import SettingsView from './SettingsView'
import Toast from './Toast'

// Cadre commun à toutes les vues : en-tête (indicateur de connexion), navigation,
// erreurs et toasts globaux. Vit dans le routeur mais sous le provider : changer de vue
// ne touche ni à la liste, ni au canal temps réel.
export default function Shell() {
  const { actionError, connection, toast, setToast } = useInventory()
  const { pathname } = useLocation()

  return (
    <div className="app">
      <NavBar />
      <main className="page">
        <header className="top">
          <h1>Frigo</h1>
          <ConnectionDot state={connection} />
        </header>
        <OfflineBanner />
        <CookingBar />
        {actionError && <p className="error" role="alert">{actionError}</p>}
        <Routes>
          <Route path="/" element={<OverviewView />} />
          <Route path="/inventaire" element={<ItemsView title="Inventaire" />} />
          {/* Ajouter reste monté hors des Routes (voir AddView) ; ici seulement l'URL est déclarée. */}
          <Route path="/ajouter" element={null} />
          <Route path="/reglages" element={<SettingsView />} />
          {/* Futures vues (recettes…) : ajouter une <Route> ici et une entrée dans NavBar. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AddView active={pathname === '/ajouter'} />
      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
