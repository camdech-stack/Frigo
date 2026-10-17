import { useInventory } from '../lib/InventoryContext'
import { offlineLabel } from '../lib/offline'

// Bandeau visible sur toutes les vues quand le réseau est coupé. L'indicateur de connexion
// (ConnectionDot) reste affiché en plus, dans l'en-tête.
export default function OfflineBanner() {
  const { connection, lastSync } = useInventory()
  if (connection !== 'offline') return null
  return <p className="offline-banner" role="status">{offlineLabel(lastSync)}</p>
}
