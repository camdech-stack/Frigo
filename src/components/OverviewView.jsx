import { useInventory } from '../lib/InventoryContext'
import { todayIso } from '../lib/expiry'
import { overviewCounts, overviewState } from '../lib/overview'
import ProductList from './ProductList'
import AddButtons from './AddButtons'
import FoodIcon from './FoodIcon'

// Vue Aperçu : « que dois-je manger en priorité ? » en 3 secondes.
// Les données viennent du provider (temps réel inclus) ; `today` est recalculé à chaque rendu,
// et le provider re-rend toutes les minutes et à minuit.
export default function OverviewView() {
  const { items, loading, loadError, reload, wakeLock } = useInventory()
  const today = todayIso()

  if (loading) return <p className="empty">Chargement…</p>
  if (loadError) {
    return (
      <div className="panel">
        <p className="error" role="alert">{loadError}</p>
        <button className="btn btn-primary" onClick={() => reload()}>Réessayer</button>
      </div>
    )
  }

  const state = overviewState(items, today)
  const counts = overviewCounts(items, today)

  return (
    <div className="ov">
      <h2 className="sr-only">Aperçu</h2>
      <div className="ov-head">
        {wakeLock.supported ? (
          !wakeLock.active && <button type="button" className="btn btn-secondary" onClick={wakeLock.start}>Je cuisine</button>
        ) : (
          <span className="ov-unsupported">Écran allumé non disponible sur cet appareil</span>
        )}
      </div>

      {/* Compteurs en encre : rouge, orange et vert sont réservés aux pastilles de péremption. */}
      <div className="ov-counters">
        <div className="ov-counter"><b>{counts.urgent}</b><span>À manger vite</span></div>
        <div className="ov-counter"><b>{counts.soon}</b><span>Cette semaine</span></div>
        <div className="ov-counter"><b>{counts.total}</b><span>Total en stock</span></div>
      </div>

      {state === 'empty' ? (
        <div className="ov-message empty-state">
          <span className="tile lg frigo-tile" aria-hidden="true"><FoodIcon name="frigo" size="var(--tile-icon)" /></span>
          <strong>Le frigo est vide</strong>
          <p>Scanne un code-barres ou saisis un produit à la main.</p>
          <AddButtons variant="solo" />
        </div>
      ) : (
        <>
          {state === 'calm' && (
            <div className="ov-message">
              <strong>Rien d'urgent aujourd'hui</strong>
              <p>Aucun produit n'expire dans les 2 prochains jours.</p>
            </div>
          )}
          <ProductList items={items} collapseLater />
        </>
      )}
    </div>
  )
}
